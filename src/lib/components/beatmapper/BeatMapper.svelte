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
            console.log((e.target as Node).nodeName);

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
    let timeRange = $derived(Shared.endTime - Shared.startTime);
    let selectedBeats: Set<Beat> = new SvelteSet();
    let containerRef = $state<HTMLDivElement>();
    function noteMouseDown(e: MouseEvent, beat: Beat) {
        if (e.getModifierState("Shift")) {
            selectedBeats.add(beat);
        } else {
            selectedBeats.clear();
            selectedBeats.add(beat);
        }
    }
    function mouseDrag(e: MouseEvent) {
        if (e.button !== 0) {
            return;
        }

        const dt = (e.movementX / 1000) * timeRange;
        for (const note of selectedBeats) {
            note.time += dt;
            if (note.endTime) {
                note.endTime += dt;
            }
        }
    }
</script>

<p>Selected Count: {selectedBeats.size}</p>
<p>Selected X: {startX}</p>
<div
    class="notesContainer"
    onclick={(e) => {
        const x = e.clientX - (e.target as Element).getBoundingClientRect().left;
        startX = x;
        if (e.target === e.currentTarget) {
            selectedBeats.clear();
        }
    }}
    onmousemove={(e) => {
        e.preventDefault();
        e.stopPropagation();

        const x = e.clientX - (e.target as Element).getBoundingClientRect().left;
        console.log(x);

        Shared.hoverTime = (x / 1000) * timeRange;

        mouseDrag(e);
    }}
>
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
            onclick={(e) => {
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
            aria-label="beat"
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
        border: 1px solid var(--border);
        border-radius: 50%;
        width: 1.5rem;
        height: 1.5rem;
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
</style>
