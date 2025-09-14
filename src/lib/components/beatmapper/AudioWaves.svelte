<script lang="ts">
    import {
        getTimeString,
        Shared,
        WaveRenderer,
    } from "$lib/components/beatmapper/AudioWaveRenderer.svelte";
    import { onMount } from "svelte";
    import { render } from "svelte/server";

    interface Props {
        bpm: number;
        bpmOffset: number;
        file?: File;
    }

    let { bpm, bpmOffset, file }: Props = $props();

    const actx = new window.AudioContext();

    async function processFile(file?: File) {
        const samplePercentage = 0.005; // divide each second of audio into 200 chunks

        if (!file) {
            return {
                sampleRate: 0,
                sampleChunkSize: 0,
                buffer: [] as unknown as Float32Array<ArrayBuffer>,
            };
        }

        const buffer = await file.arrayBuffer();
        const decoded = await actx.decodeAudioData(buffer);

        const sampleRate = decoded.sampleRate;
        const sampleChunkSize = Math.floor(sampleRate * samplePercentage);
        const chunksCount = Math.floor(decoded.length / sampleChunkSize);

        const _buffer = decoded.getChannelData(0);
        const output = new Float32Array(chunksCount);

        // set output to be average each chunk for visual representation
        for (let c = 0; c < chunksCount; c++) {
            const offset = c * sampleChunkSize;

            let avg = 0;
            for (let s = offset; s < offset + sampleChunkSize; s++) {
                avg += Math.abs(_buffer[s]);
            }
            output[c] = avg / sampleChunkSize;
        }

        return {
            buffer: output,
            sampleRate,
            sampleChunkSize,
            chunksCount,
            decodedAudioBuffer: decoded,
        };
    }

    const { sampleRate, sampleChunkSize, buffer, chunksCount, decodedAudioBuffer } = $derived(
        await processFile(file),
    );
    let canvas: HTMLCanvasElement | undefined = $state();

    const renderer = $derived.by(() => {
        if (!canvas) {
            return undefined;
        }
        return new WaveRenderer(canvas);
    });

    $effect(() => {
        renderer?.updateSamples(sampleRate, sampleChunkSize, buffer);
    });

    $effect(() => {
        renderer?.updateBpm(bpm, bpmOffset);
    });

    let isPlaying = $state(false);
    let lastPlayTime = $state(0);
    let offsetTime = $state(0);
    let audioSource = $state<AudioBufferSourceNode | undefined>();
    let timeRange = $derived(Shared.endTime - Shared.startTime);
    let pointerLocation = $derived(((Shared.hoverTime - Shared.startTime) / timeRange) * 1000);

    function createSource() {
        if (!decodedAudioBuffer) {
            return;
        }
        const bufferSource = actx.createBufferSource();
        bufferSource.buffer = decodedAudioBuffer;
        bufferSource.connect(actx.destination);

        return bufferSource;
    }

    function togglePlay() {
        console.log("in toggle");

        if (!renderer) {
            return;
        }
        if (!isPlaying) {
            audioSource = createSource();
            audioSource!.start(actx.currentTime, offsetTime);
            lastPlayTime = actx.currentTime;
            isPlaying = true;
        } else {
            if (audioSource) audioSource.stop();
            offsetTime += actx.currentTime - lastPlayTime;
            isPlaying = false;
        }
    }

    function seek(timeStamp: number) {
        if (!decodedAudioBuffer || !renderer) {
            return;
        }
        offsetTime = Math.max(0, Math.min(timeStamp, decodedAudioBuffer.duration));

        if (isPlaying) {
            if (audioSource) audioSource.stop();

            audioSource = createSource();
            audioSource!.start(actx.currentTime, offsetTime);
            lastPlayTime = actx.currentTime;
        } else {
            togglePlay();
        }
    }

    onMount(() => {
        function updateTime() {
            if (!renderer) {
                return;
            }

            if (isPlaying) {
                renderer.currentTime = actx.currentTime - lastPlayTime + offsetTime;
            } else {
                renderer.currentTime = offsetTime;
            }

            if (renderer.currentTime > (decodedAudioBuffer?.duration ?? 0)) {
                isPlaying = false;
            }

            requestAnimationFrame(updateTime);
        }

        requestAnimationFrame(updateTime);

        document.addEventListener("keypress", (e) => {
            const targetName = (e.target as Node).nodeName;
            if (targetName === "INPUT" || targetName === "BUTTON") {
                return;
            }
            e.preventDefault();
            if (e.key === " ") {
                togglePlay();
            }
        });
    });

    $effect(() => {
        if (!renderer) {
            return;
        }
        if (
            isPlaying &&
            renderer.currentTime > Shared.endTime &&
            Shared.endTime + timeRange < decodedAudioBuffer!.duration
        ) {
            const range = timeRange;
            renderer.shift(range * 0.75);
        }
    });
</script>

{#snippet TimerLabel(time: number, x: number, y: number)}
    {#if time > 0}
        <div class="label" style="--x: {x}px; --y: {y}px;">
            {getTimeString(time)}
        </div>
    {/if}
{/snippet}

<div class="canvasContainer">
    {@render TimerLabel(Shared.hoverTime ?? 0, pointerLocation, renderer!.pointer.y)}
    <div class="cursorIndicator" style="--x: {pointerLocation ?? 0}px"></div>
    <div
        class="cursorIndicator"
        style="--x:{renderer?.indicatorX}px; border-color: var(--orange);"
    ></div>
    <canvas
        bind:this={canvas}
        width="1000"
        height="300"
        onclick={(e) => {
            seek(renderer?.pointToTime(e.offsetX) ?? 0);
        }}
    ></canvas>
</div>

<p>
    Start: {getTimeString(Shared.startTime ?? 0)}, End: {getTimeString(Shared.endTime ?? 0)},
    Current: {getTimeString(renderer?.currentTime ?? 0)}
</p>

<button
    onclick={() => {
        togglePlay();
    }}
    >{!isPlaying ? "Play" : "Pause"}
</button>

<style>
    button,
    input {
        padding: 0.5rem;
        border: 1px solid var(--border);
        margin: 0.25rem;
    }
    canvas {
        border: 1px solid var(--border);
        background-color: var(--bg2);
    }

    .label {
        position: absolute;
        left: var(--x);
        top: var(--y);

        padding: 0.25rem;
        border: 1px solid var(--border);
        background-color: var(--bg);

        transform: translate(0.25rem, -100%);

        pointer-events: none;
    }

    .cursorIndicator {
        position: absolute;
        left: var(--x);
        top: 0;

        height: 100%;
        border-left: 1px solid var(--red);

        pointer-events: none;
    }

    .canvasContainer {
        position: relative;
        overflow: hidden;

        display: flex;
        width: fit-content;
    }
</style>
