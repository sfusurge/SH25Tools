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

    let sortedBeats = $derived(beats.toSorted((a, b) => a.time - b.time));
    let beatsInRange = $derived(
        sortedBeats.filter((b) => {
            return b.time >= Shared.startTime && b.time <= Shared.endTime;
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
    });

    let startX = $state(0);
    let startY = $state(0);
    let boxX = $state(-1);
    let boxY = $state(-1);
    let timeRange = $derived(Shared.endTime - Shared.startTime);
    let selectedBeats: Set<Beat> = new SvelteSet();
    let containerRef = $state<HTMLDivElement>();
    let debug = $state<Record<string, any>>({});

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

        if (e.target === containerRef) {
            // background drag
            const box = containerRef!.getBoundingClientRect();
            boxX = e.clientX - box.left;
            boxY = e.clientY - box.top;
        } else {
            // note drag
            const dt = (e.movementX / 1000) * timeRange;
            for (const note of selectedBeats) {
                note.time += dt;
                if (note.endTime) {
                    note.endTime += dt;
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
        // calculate selection
        const t0 = (startX / 1000) * timeRange;
        const t1 = (boxX / 1000) * timeRange;

        // reset states
        boxX = -1;
        boxY = -1;
        startX = 0;
        startY = 0;
    }
</script>

<pre><code>
    {JSON.stringify(debug, undefined, 4)}
</code></pre>

<div
    bind:this={containerRef}
    class="notesContainer"
    onmousedown={backgroundMouseDown}
    onmousemove={(e) => {
        e.preventDefault();
        e.stopPropagation();

        const x = e.clientX - containerRef!.getBoundingClientRect().left;
        Shared.hoverTime = (x / 1000) * timeRange;
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
        <button
            class="beat"
            class:red={beat.value === 0}
            class:blue={beat.value === 1}
            class:green={beat.value === 2}
            style="--x: {((beat.time - Shared.startTime) / (Shared.endTime - Shared.startTime)) *
                1000}px;"
            onmousedown={(e) => {
                e.preventDefault();
                // e.stopPropagation();
                noteMouseDown(e, beat);
            }}
            oncontextmenu={(e) => {
                e.preventDefault();
                e.stopPropagation();

                // delete note
                beats.splice(
                    beats.findIndex((b) => {
                        return b.time === beat.time && b.value === beat.value;
                    }),
                    1,
                );
            }}
            class:selected={selectedBeats.has(beat)}
        ></button>
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
        border: 2px solid var(--border);
        border-radius: 50%;
        width: 36px;
        height: 36px;
        outline: none;
    }

    .beat.selected {
        border: 3px solid var(--header);
    }

    .red {
        background-color: var(--red);
        transform: translate(calc(var(--x) - 50%), calc(75px - 50%));
    }

    .blue {
        background-color: var(--aqua);
        transform: translate(calc(var(--x) - 50%), calc(150px - 50%));
    }

    .green {
        background-color: var(--green);
        transform: translate(calc(var(--x) - 50%), calc(225px - 50%));
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
