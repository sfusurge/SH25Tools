export const EntityMap = {
    rock: 1,
    trap: 2,
    scroll: 3,
    walker: 10,
    shooter: 11,
    bruiser: 12
};

export const EntityTypes = Object.values(EntityMap);

export const SpriteMap: Record<typeof EntityMap[keyof typeof EntityMap], string> = {
    [EntityMap.bruiser]: "/enemy_2.webp",
    [EntityMap.walker]: "/enemy_1.webp",
    [EntityMap.shooter]: "/enemy_3.webp",
    [EntityMap.rock]: "/rock.webp",
    [EntityMap.scroll]: "/scroll.webp",
    [EntityMap.trap]: "/trap.webp",
}