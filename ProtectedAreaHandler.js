import { world, system, Vector, BlockVolumeUtils } from "@minecraft/server";

export class ProtectedAreas {
    constructor() {
        if (!world.getDynamicProperty("protectedAreas")) {
            world.setDynamicProperty("protectedAreas", JSON.stringify([]));
        }
        if (!world.getDynamicProperty("protectedAreasAdmins")) {
            world.setDynamicProperty(
                "protectedAreasAdmins",
                JSON.stringify([])
            );
        }
    }

    //GET

    getProtectedAreas() {
        return JSON.parse(world.getDynamicProperty("protectedAreas"));
    }

    getArea({ id }) {
        const protectedAreas = this.getProtectedAreas();

        return protectedAreas.find(area => area.id == id);
    }

    getAreaWhitelist({ id }) {
        const protectedAreas = this.getProtectedAreas();

        const area = protectedAreas.find(area => area.id == id);

        if (area) {
            return area.whitelist;
        }
    }

    getAdmins() {
        return JSON.parse(world.getDynamicProperty("protectedAreasAdmins"));
    }

    //SET

    areaWhitelistAdd({ id, player }) {
        const whitelist = this.getAreaWhitelist({ id });

        if (whitelist) {
            const isDuplicated = whitelist.some(name => name == player);

            if (!isDuplicated) {
                whitelist.push(player);

                this.updateAreaWhitelist({ id, data: whitelist });

                console.warn(`§b${player}§f §eadded to ${id} whitelist!§f`);
            }
        }
    }

    addAdmin({ player }) {
        const admins = this.getAdmins();

        const isInAdminList = admins.some(admin => admin == player);

        if (!isInAdminList) {
            admins.push(player);

            console.warn(`§b${player}§f §eadded to the admins list!`);

            this.updateAdmins({ data: admins });
        }
    }

    setArea({ name, from, to }) {
        const protectedAreas = this.getProtectedAreas();

        const hasDuplicatedId = protectedAreas.find(area => area.id == name);

        if (hasDuplicatedId) {
            console.error(
                `§b${name}§f §eis already in use, try another area name!`
            );
            return;
        }

        if (from instanceof Vector && to instanceof Vector) {
            const newArea = {
                id: name,
                whitelist: [],
                from: {
                    x: from.x,
                    y: from.y,
                    z: from.z
                },
                to: {
                    x: to.x,
                    y: to.y,
                    z: to.z
                }
            };

            const hasIntersection = protectedAreas.some(
                area =>
                    BlockVolumeUtils.intersects(
                        {
                            from: area.from,
                            to: area.to
                        },
                        {
                            from: newArea.from,
                            to: newArea.to
                        }
                    ) == 2
            );

            if (!hasIntersection) {
                protectedAreas.push(newArea);

                this.update({ data: protectedAreas });

                console.warn(`§b${name}§f §eadded to protected areas!§f`);
            } else {
                console.warn(
                    `§b${name}§f §ecan't be created because is being intersected by another area boundary!`
                );
            }
        } else {
            console.error(
                `§eParams not match to the required param types! expected§f §bVector§f`
            );
        }
    }

    //UPDATE

    update({ data }) {
        const stringify = JSON.stringify(data);

        world.setDynamicProperty("protectedAreas", stringify);
    }

    updateAdmins({ data }) {
        const stringify = JSON.stringify(data);

        world.setDynamicProperty("protectedAreasAdmins", stringify);
    }

    updateAreaWhitelist({ id, data }) {
        const protectedAreas = this.getProtectedAreas();

        const area = protectedAreas.find(area => area.id == id);

        if (area) {
            area.whitelist = data;

            this.update({ data: protectedAreas });
        }
    }

    //DELETE

    deleteArea({ id }) {
        const protectedAreas = this.getProtectedAreas();

        const index = protectedAreas.findIndex(area => area.id == id);

        if (index > -1) {
            const removedArea = protectedAreas.splice(index, 1)[0].id;

            console.warn(`§b${removedArea}§f §edeleted from Protected Areas§f`);

            this.update({ data: protectedAreas });
        }
    }

    deleteAllAreas() {
        const protectedAreas = this.getProtectedAreas();

        protectedAreas.splice(0);

        console.warn("§eAll areas has been deleted!");

        this.update({ data: protectedAreas });
    }

    clearAreaWhitelist({ id }) {
        const whitelist = this.getAreaWhitelist({ id });

        if (whitelist) {
            whitelist.splice(0);

            console.warn(`§b${id}§f §ewhitelist has been cleared!`);

            this.updateAreaWhitelist({ id, data: whitelist });
        }
    }

    removeAdmin({ player }) {
        const admins = this.getAdmins();

        const isInAdminList = admins.some(admin => admin == player);

        if (isInAdminList) {
            const index = admins.findIndex(admin => admin == player);

            if (index > -1) {
                admins.splice(index, 1);

                console.warn(`§b${player}§f §eremoved from admins list!`);

                this.updateAdmins({ data: admins });
            }
        }
    }

    removeAllAdmins() {
        const admins = this.getAdmins();

        admins.splice(0);

        this.updateAdmins({ data: admins });

        console.warn(`§eAdmins list cleared!§f`);
    }

    areaWhitelistRemove({ id, player }) {
        const whitelist = this.getAreaWhitelist({ id });

        if (whitelist) {
            const isInWhitelist = whitelist.some(name => name == player);

            if (isInWhitelist) {
                const index = whitelist.findIndex(name => name == player);

                if (index > -1) {
                    whitelist.splice(index, 1);

                    this.updateAreaWhitelist({ id, data: whitelist });

                    console.warn(
                        `§b${player}§f §eremoved from§f §b${id}§f §ewhitelist!§f`
                    );
                }
            }
        }
    }
}

class Area {
    constructor(AreaBox) {
        this.left = Math.min(AreaBox.from.x, AreaBox.to.x);
        this.right = Math.max(AreaBox.from.x, AreaBox.to.x);
        this.back = Math.min(AreaBox.from.z, AreaBox.to.z);
        this.front = Math.max(AreaBox.from.z, AreaBox.to.z);
        this.bottom = Math.min(AreaBox.from.y, AreaBox.to.y);
        this.top = Math.max(AreaBox.from.y, AreaBox.to.y);
    }
}

class AreaUtils {
    static isInside(BlockLocation, Area) {
        if (
            BlockLocation.x >= Area.left &&
            BlockLocation.x <= Area.right &&
            BlockLocation.z <= Area.front &&
            BlockLocation.z >= Area.back &&
            BlockLocation.y >= Area.bottom &&
            BlockLocation.y <= Area.top
        ) {
            return true;
        } else return false;
    }

    static getAreaFromBlockLocation(BlockLocation, AreaArray) {
        this.area = AreaArray.find(
            area =>
                BlockLocation.x >= new Area(area).left &&
                BlockLocation.x <= new Area(area).right &&
                BlockLocation.z <= new Area(area).front &&
                BlockLocation.z >= new Area(area).back &&
                BlockLocation.y >= new Area(area).bottom &&
                BlockLocation.y <= new Area(area).top
        );

        if (this.area) {
            return this.area;
        } else return undefined;
    }

    static intersects(AreaA, AreaB) {
        if (
            AreaA.right < AreaB.left ||
            AreaA.left > AreaB.right ||
            AreaA.front < AreaB.back ||
            AreaA.back > AreaB.front ||
            AreaA.top < AreaB.bottom ||
            AreaA.bottom > AreaB.top
        ) {
            return false;
        } else return true;
    }
}

const protectedAreas = new ProtectedAreas();

function getBlockFromFace(block, face) {
    switch (face) {
        case "Up": {
            return block.above();
        }
        case "Down": {
            return block.below();
        }
        case "North": {
            return block.north();
        }
        case "South": {
            return block.south();
        }
        case "East": {
            return block.east();
        }
        case "West": {
            return block.west();
        }
    }
}

function handlePlayerInteractWithBlocks({ player, block, data }) {
    const areas = protectedAreas.getProtectedAreas();

    const blockInsideProtectedArea = areas.some(area =>
        AreaUtils.isInside(block.location, new Area(area))
    );

    const playerIsAdmin = protectedAreas.getAdmins().includes(player.name);

    const playerIsWhitelisted = AreaUtils.getAreaFromBlockLocation(
        block.location,
        areas
    )?.whitelist.includes(player.name);

    if (playerIsAdmin) {
        return;
    } else if (blockInsideProtectedArea) {
        data.cancel = !playerIsWhitelisted;
    } else return;
}

world.beforeEvents.playerPlaceBlock.subscribe(data => {
    const { block, player, face } = data;

    const interactedBlock = getBlockFromFace(block, face);

    handlePlayerInteractWithBlocks({ player, block: interactedBlock, data });
});

world.beforeEvents.playerInteractWithBlock.subscribe(data => {
    const { block, player } = data;

    handlePlayerInteractWithBlocks({ player, block, data });
});

world.beforeEvents.playerBreakBlock.subscribe(data => {
    const { block, player } = data;

    handlePlayerInteractWithBlocks({ player, block, data });
});
