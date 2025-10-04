<script lang="ts">
    import { onMount, untrack } from "svelte";
    import Maze from "./Maze.svelte";
    import { EntityMap, SpriteMap } from "./shared.svelte";
    import { publishMaze } from "$lib/components/firebase/api";

    let currentMaze = $state({
        id: 1,
        description: "Small Rectangle",
        width: 4,
        height: 3,
        obstacleMap: [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 4, 1, 0, 0],
            [0, 0, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 0, 0, 1, 0, 0],
            [0, 0, 0, 4, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
        ],
    });

    let mr = $state(4);
    let mc = $state(5);
    let userId = $state("");
    let selectedCell = $state({ row: -1, col: -1 });
    let entityType = $state<(typeof EntityMap)[keyof typeof EntityMap] | undefined>();
    onMount(() => {
        // load user id
        userId = localStorage.getItem("userid") ?? crypto.randomUUID();
        localStorage.setItem("userid", userId);

        window.addEventListener("keydown", (e) => {
            if ((e.target as HTMLElement).tagName.toLowerCase() === "input") {
                return;
            }
            const keyMap: Record<
                string | number,
                (typeof EntityMap)[keyof typeof EntityMap] | undefined
            > = {
                1: EntityMap.rock,
                2: EntityMap.trap,
                3: EntityMap.scroll,
                4: EntityMap.walker,
                5: EntityMap.shooter,
                6: EntityMap.bruiser,
            };

            entityType = keyMap[e.key];
        });
    });

    $effect(() => {
        if (mr < 2 || mc < 2) {
            return;
        }
        // skilled diff frfr
        untrack(() => {
            currentMaze.obstacleMap = [];
            for (let r = 0; r < mr * 2; r++) {
                currentMaze.obstacleMap.push(new Array(mc * 2).fill(0));
            }
            currentMaze.id = Math.floor(Math.random() * 99999999999);
        });
    });

    let files: FileList | undefined = $state();
    $effect(() => {
        if (files && files.length === 1) {
            files
                .item(0)!
                .text()
                .then((res) => {
                    // @ts-ignore
                    currentMaze = JSON.parse(res);
                });
        }
    });
</script>

<div class="ver">
    <label for="">Maze Name: <input type="text" bind:value={currentMaze.description} /></label>
    <label for="">Maze Rows: <input type="number" bind:value={mr} /></label>
    <label for="">Maze Cols: <input type="number" bind:value={mc} /></label>
    <div class="hor">
        <label for="loader"><input id="loader" type="file" bind:files /></label>
        <button
            onclick={() => {
                const anchor = document.createElement("a");
                anchor.setAttribute(
                    "href",
                    "data:text/plain;charset=utf-8," +
                        encodeURIComponent(JSON.stringify(currentMaze)),
                );
                anchor.setAttribute("download", `${currentMaze.description}.maze`);
                anchor.style.display = "none";

                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);
            }}
        >
            Export
        </button>
        <button
            onclick={() => {
                publishMaze(currentMaze, userId);
                alert("Submitted! (dw, we really received it)");
            }}
        >
            Submit
        </button>
    </div>
</div>
<div class="hor" style="align-items: flex-end;">
    {#each Object.entries(EntityMap) as [name, id], index (id)}
        <button
            class="ver"
            style="align-items: center; border: 2px solid transparent;"
            class:selected={id === entityType}
            onclick={() => {
                entityType = id;
            }}
        >
            <img class="label" src={SpriteMap[id]} alt="" />
            <div>{index + 1}.{name}</div>
        </button>
    {/each}
</div>

<div style="position: relative;">
    <Maze {...currentMaze} bind:selected={selectedCell} />

    {#if entityType && selectedCell}
        <img
            src={SpriteMap[entityType]}
            alt=""
            class="preview"
            style="--x: {selectedCell.col * 50}px; --y: {selectedCell.row * 50}px;"
            oncontextmenu={(e) => {
                e.preventDefault();
                currentMaze.obstacleMap[selectedCell.row][selectedCell.col] = 0;
            }}
            onclick={(e) => {
                e.preventDefault();
                currentMaze.obstacleMap[selectedCell.row][selectedCell.col] = entityType!;
            }}
        />
    {/if}
</div>

<h2>Instructions...</h2>
<ol>
    <li>Write a room name</li>
    <li>
        Choose a room size (rows, cols) <b><i>** CHANGING SIZE RESETS THE WHOLE ROOM **</i></b>
    </li>
    <li>Use keyboard 1, 2, 3, 4, 5, 6 number keys to choose which entity to place.</li>
    <li>Left click to place, right click to remove.</li>
    <li>Use load/export to save your process</li>
    <li>
        Click submit to submit your maze (we'll receive, even if it looks like nothing happened)
    </li>
</ol>

<style>
    .hor {
        display: flex;
        flex-direction: row;
        gap: 1.5rem;
    }

    .ver {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    img.label {
        width: 50px;
    }

    img.preview {
        width: 50px;
        height: auto;
        max-height: 50px;
        position: absolute;

        left: 0;
        top: 0;

        transform: translate(var(--x), var(--y));
        z-index: 100;
        opacity: 50%;

        pointer-events: all;
    }

    .selected {
        border: 2px solid var(--red) !important;
    }

    button {
        border: 1px solid var(--primary);
        padding: 0.5rem;
    }
</style>
