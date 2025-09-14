<script module>
    export interface Beat {
        time: number;
        endTime?: number;
        value: 0 | 1 | 2;
    }
</script>

<script lang="ts">
    import { Shared } from "$lib/components/beatmapper/AudioWaveRenderer.svelte";
    import { onMount } from "svelte";
    import { SvelteSet } from "svelte/reactivity";

    interface Props {
        beats: Beat[];
    }

    let { beats = $bindable() }: Props = $props();

    let resizing = $state(false);
    let startX = $state(0);
    let startY = $state(0);
    let boxX = $state(-1);
    let boxY = $state(-1);
    let timeRange = $derived(Shared.endTime - Shared.startTime);
    let selectedBeats: Set<Beat> = new SvelteSet();
    let containerRef = $state<HTMLDivElement>();

    let sortedBeats = $derived(beats.toSorted((a, b) => a.time - b.time));
    let beatsInRange = $derived(
        sortedBeats.filter((b) => {
            if (!b.endTime){
                return b.time >= Shared.startTime && b.time <= Shared.endTime;
            } else{
                return b.endTime >= Shared.startTime && b.time <= Shared.endTime;
            }
        }),
    );
    let beatsAhead = $derived(
        sortedBeats.filter((b) => {
            const d = b.time - Shared.currentTime;
            return d > 0 && d <= 5;
        }),
    );

    onMount(() => {
        document.addEventListener("keyup", (e) => {
            if ((e.target as Node).nodeName === "INPUT") {
                return;
            }

            if (e.key === "1") {
                beats.push({
                    time: Shared.hoverTime,
                    value: 0,
                });
            }

            if (e.key === "2") {
                beats.push({
                    time: Shared.hoverTime,
                    value: 1,
                });
            }

            if (e.key === "3") {
                beats.push({
                    time: Shared.hoverTime,
                    value: 2,
                });
            }
        });

        document.addEventListener("keydown", (e) => {
            if ((e.target as Node).nodeName === "INPUT") {
                return;
            }

            if (e.key === "Backspace" || e.key === "Delete") {
                if (selectedBeats.size > 0) {
                    const res = [];
                    for (const b of beats) {
                        if (!selectedBeats.has(b)) {
                            res.push(b);
                        }
                    }
                    beats = res;
                }
            }
        });
    });

    function noteMouseDown(e: MouseEvent, beat: Beat) {
        if (e.getModifierState("Shift")) {
            selectedBeats.add(beat);
        } else if (selectedBeats.size <= 1) {
            selectedBeats.clear();
            selectedBeats.add(beat);
        }
    }

    function backgroundMouseMove(e: MouseEvent) {
        if (e.buttons !== 1) {
            return;
        }

        if (e.target === containerRef && selectedBeats.size === 0) {
            // background drag
            const box = containerRef!.getBoundingClientRect();
            boxX = e.clientX - box.left;
            boxY = e.clientY - box.top;
        } else {
            // note drag
            const dt = (e.movementX / 1000) * timeRange;

            if (!resizing) {
                for (const note of selectedBeats) {
                    note.time += dt;
                    if (note.endTime) {
                        note.endTime += dt;
                    }
                }
            } else {
                for (const note of selectedBeats) {
                    if (note.endTime) {
                        note.endTime += dt;
                        console.log(note.endTime);

                        if (note.endTime < note.time + 1) {
                            note.endTime = note.time + 1;
                        }
                    }
                }
            }
        }
    }

    function backgroundMouseDown(e: MouseEvent) {
        const box = containerRef!.getBoundingClientRect();
        startX = e.clientX - box.left;
        startY = e.clientY - box.top;

        if (e.target === e.currentTarget) {
            selectedBeats.clear();
        }
    }

    function backgroundMouseUp(e: MouseEvent) {
        resizing = false;
        if (boxX === -1 || boxY === -1) {
            return;
        }

        // calculate selection
        const t0 = (Math.min(startX, boxX) / 1000) * timeRange + Shared.startTime;
        const t1 = (Math.max(boxX, startX) / 1000) * timeRange + Shared.startTime;

        const half = 35 / 2;
        const low = Math.min(startY, boxY);
        const high = Math.max(startY, boxY);
        const select0 = low <= 75 && high >= 75;
        const select1 = low <= 150 && high >= 150;
        const select2 = low <= 225 && high >= 225;
        selectedBeats.clear();
        for (const beat of beatsInRange) {
            if (beat.time >= t0 && beat.time <= t1) {
                if (
                    (select0 && beat.value === 0) ||
                    (select1 && beat.value === 1) ||
                    (select2 && beat.value === 2)
                ) {
                    selectedBeats.add(beat);
                }
            }
        }

        // reset states
        boxX = -1;
        boxY = -1;
        startX = 0;
        startY = 0;
    }
</script>

<div
    bind:this={containerRef}
    class="notesContainer"
    onmousedown={backgroundMouseDown}
    onmousemove={(e) => {
        e.preventDefault();
        e.stopPropagation();

        const x = e.clientX - containerRef!.getBoundingClientRect().left;
        Shared.hoverTime = (x / 1000) * timeRange + Shared.startTime;
        backgroundMouseMove(e);
    }}
    onmouseup={backgroundMouseUp}
>
    {#if boxX > 0 && boxY > 0}
        <div
            class="box"
            style="top: {Math.min(startY, boxY)}px; left:{Math.min(
                startX,
                boxX,
            )}px; width: {Math.abs(startX - boxX)}px; height: {Math.abs(startY - boxY)}px; "
        ></div>
    {/if}

    <div class="divider" style="top: 75px;"></div>
    <div class="divider" style="top: 150px;"></div>
    <div class="divider" style="top: 225px;"></div>
    {#key Shared.hoverTime}
        <div
            class="indicator"
            style="--x: {((Shared.hoverTime - Shared.startTime) /
                (Shared.endTime - Shared.startTime)) *
                1000}px;"
        ></div>
    {/key}
    {#each beatsInRange as beat, index (index)}
        <div
            class="beat"
            class:red={beat.value === 0}
            class:blue={beat.value === 1}
            class:green={beat.value === 2}
            style="--x: {((beat.time - Shared.startTime) / (Shared.endTime - Shared.startTime)) *
                1000}px; --width: {(((beat.endTime ?? 0) - beat.time) / timeRange) * 1000}px;"
            onmousedown={(e) => {
                e.preventDefault();
                // e.stopPropagation();
                noteMouseDown(e, beat);
            }}
            oncontextmenu={(e) => {
                e.preventDefault();
                e.stopPropagation();

                if (beat.endTime) {
                    beat.endTime = undefined;
                } else {
                    beat.endTime = beat.time + 2;
                }
            }}
            class:selected={selectedBeats.has(beat)}
            class:hasTail={beat.endTime !== undefined}
        >
            {#if beat.endTime}
                <button
                    class="tail"
                    style="--x: {((beat.endTime - beat.time) / timeRange) * 1000}px;"
                    onmousedown={(e) => {
                        resizing = true;
                    }}
                >
                </button>
            {/if}
        </div>
    {/each}
</div>

<style>
    .notesContainer {
        position: relative;
        width: 1000px;
        height: 300px;

        border: 1px solid var(--border);
        overflow: hidden;
    }

    .beat {
        position: absolute;
        left: 0;
        top: 0;
        width: 36px;
        height: 36px;
        outline: none;
        cursor: pointer;
    }

    .beat::before {
        content: "";
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) rotate(45deg);

        width: 30px;
        height: 30px;
        border: 2px solid var(--border);
    }

    .beat.hasTail::before {
        transform: translate(-50%, -50%) scale(0.75, 1) rotate(45deg);
    }

    .beat.hasTail::after {
        content: "";
        position: absolute;
        left: 50%;
        top: 50%;
        width: var(--width);
        height: 4px;
        z-index: -1;
        transform: translate(0, -50%);
    }

    .beat.selected::before {
        border: 3px solid var(--header);
    }

    .red {
        transform: translate(calc(var(--x) - 50%), calc(75px - 50%));
    }
    .red::before,
    .red > .tail::before,
    .red.beat.hasTail::after {
        background-color: var(--red);
    }

    .blue {
        transform: translate(calc(var(--x) - 50%), calc(150px - 50%));
    }
    .blue::before,
    .blue > .tail::before,
    .blue.beat.hasTail::after {
        background-color: var(--aqua);
    }
    .green {
        transform: translate(calc(var(--x) - 50%), calc(225px - 50%));
    }
    .green::before,
    .green > .tail::before,
    .green.beat.hasTail::after {
        background-color: var(--green);
    }

    .tail {
        position: absolute;
        top: 0;
        left: var(--x);

        width: 35px;
        height: 35px;

        outline: none;
        cursor: pointer;
    }

    .tail::before {
        content: "";
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) scale(0.4, 1) rotate(45deg);

        width: 30px;
        height: 30px;
        border: 2px solid var(--border);
    }

    .indicator {
        position: absolute;
        left: var(--x);
        top: 0;
        height: 100%;

        border-left: 1px solid var(--border);

        pointer-events: none;
    }

    .divider {
        position: absolute;
        left: 0;
        width: 100%;
        border-top: 1px solid var(--border2);
    }

    .box {
        position: absolute;
        border: 2px solid var(--header);
        pointer-events: none;
    }
</style>
