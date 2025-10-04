<script lang="ts">
    import { EntityTypes, SpriteMap } from "./shared.svelte";

    interface IMaze {
        ownerId?: string;

        id: number;
        description: string;
        width: number;
        height: number;
        obstacleMap: number[][];

        selected: { row: number; col: number };
    }

    let { id, description, width, height, obstacleMap, selected = $bindable() }: IMaze = $props();
</script>

<div class="mazeContainer">
    {#each obstacleMap as row, r}
        <div class="mazeRow">
            {#each row as item, c}
                {@const edge =
                    r == 0 ||
                    c == 0 ||
                    r == obstacleMap.length - 1 ||
                    c == obstacleMap[0].length - 1}
                <div
                    class:edge
                    class="mazeCell"
                    onmouseenter={() => {
                        if (edge) {
                            return;
                        }
                        selected = { row: r, col: c };
                    }}
                >
                    {#if EntityTypes.includes(item)}
                        <img src={SpriteMap[item]} alt="" />
                    {/if}
                </div>
            {/each}
        </div>
    {/each}
</div>

<style>
    .mazeContainer {
        display: flex;
        flex-direction: column;
    }

    .mazeRow {
        display: flex;
        flex-direction: row;
    }

    .mazeCell {
        min-width: 50px;
        width: 50px;
        height: 50px;

        background-color: #b78ee3;
        box-sizing: border-box;
        border: 1px solid #9c79c2;

        position: relative;
    }

    .edge {
        background-color: black;
    }

    img {
        min-width: 50px;
        width: 50px;
        height: auto;
        max-height: 50px;

        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    }
</style>
