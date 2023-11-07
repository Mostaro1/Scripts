import { world, system } from "@minecraft/server";

class Waypoints {
    constructor(name) {
        this.name = name;

        if (!world.getDynamicProperty(name)) {
            world.setDynamicProperty(name, JSON.stringify([]));
        }
    }

    getAllWaypoints() {
        return JSON.parse(world.getDynamicProperty(this.name)).map(
            waypoint => new Waypoint(waypoint)
        );
    }

    getPlayerWaypoints({ player }) {
        const waypoints = this.getAllWaypoints();

        return waypoints.filter(
            waypoint =>
                waypoint.owner == player.name ||
                waypoint.whitelist.includes(player.name)
        );
    }

    teleportPlayerTo({ name, player }) {
        const waypoints = this.getAllWaypoints();

        const waypoint = waypoints.find(wp => wp.name == name);

        if (waypoint) {
            player.tryTeleport(waypoint.location, {
                dimension: world.getDimension(waypoint.dimension.id)
            });
        }
    }

    deleteAllWaypoints() {
        const waypoints = this.getAllWaypoints();

        waypoints.splice(0, waypoints.length);

        this.update({ data: waypoints });
    }

    createWaypoint({
        name,
        owner,
        location,
        dimension,
        whitelist,
        color,
        type
    }) {
        const waypoints = this.getAllWaypoints();

        const waypoint = new Waypoint({
            name,
            owner,
            location,
            dimension,
            whitelist,
            color,
            type
        });

        const isDuplicated = waypoints.some(
            wp => wp.name == name && wp.owner == owner
        );

        if (!isDuplicated) {
            waypoints.push(waypoint);

            console.warn(`§b${name}§f §esuccessfully created!§f`);
            this.update({ data: waypoints });
        } else {
            console.warn(
                `§eFail to create§f, §b${name}§f §ename already in use!§f`
            );
        }
    }

    deleteWaypoint({ name }) {
        const waypoints = this.getAllWaypoints();

        const index = waypoints.findIndex(waypoint => waypoint.name == name);

        if (index > -1) {
            waypoints.splice(index, 1);

            this.update({ data: waypoints });
        }
    }

    update({ data }) {
        world.setDynamicProperty(this.name, JSON.stringify(data));
    }

    waypointWhitelistAdd({ name, player }) {
        const waypoints = this.getAllWaypoints();

        const waypointToUpdate = waypoints.find(
            waypoint => waypoint.name == name
        );

        if (waypointToUpdate) {
            waypointToUpdate.whitelistAdd({
                player
            });

            this.update({ data: waypoints });
        }
    }

    waypointWhitelistRemove({ name, player }) {
        const waypoints = this.getAllWaypoints();

        const waypointToUpdate = waypoints.find(
            waypoint => waypoint.name == name
        );

        if (waypointToUpdate) {
            waypointToUpdate.whitelistRemove({
                player
            });

            this.update({ data: waypoints });
        }
    }

    waypointChangeName({ name, newName }) {
        const waypoints = this.getAllWaypoints();

        const waypointToUpdate = waypoints.find(
            waypoint => waypoint.name == name
        );

        if (waypointToUpdate) {
            waypointToUpdate.changeName({
                newName
            });

            this.update({ data: waypoints });
        }
    }

    waypointChangeColor({ name, color }) {
        const waypoints = this.getAllWaypoints();

        const waypointToUpdate = waypoints.find(
            waypoint => waypoint.name == name
        );

        if (waypointToUpdate) {
            waypointToUpdate.changeColor({
                color
            });

            this.update({ data: waypoints });
        }
    }

    waypointChangeType({ name, type }) {
        const waypoints = this.getAllWaypoints();

        const waypointToUpdate = waypoints.find(
            waypoint => waypoint.name == name
        );

        if (waypointToUpdate) {
            waypointToUpdate.changeType({
                type
            });

            this.update({ data: waypoints });
        }
    }
}

class Waypoint {
    constructor({ name, owner, location, dimension, whitelist, color, type }) {
        this.name = name;
        this.owner = owner;
        this.location = location;
        this.dimension = dimension;
        this.whitelist = whitelist;
        this.color = color;
        this.type = type;

        this.colors = ["blue", "yellow", "black"];
    }

    whitelistAdd({ player }) {
        if (this.whitelist.includes(player)) {
            console.warn(`§b${player}§f §ealready is in the whitelist!§f`);
            return;
        } else {
            console.warn(
                `§b${player}§f §enow is in§f §b${this.name}§f §ewhitelist!§f`
            );
            this.whitelist.push(player);
        }
    }

    whitelistRemove({ player }) {
        if (!this.whitelist.includes(player)) {
            console.warn(`§b${player}§f §enot found in the whitelist!§f`);
            return;
        } else {
            const index = this.whitelist.findIndex(name => name == player);

            if (index > -1) {
                console.warn(
                    `§b${player}§f §eremoved from§f §b${this.name}§f §ewhitelist!§f`
                );

                this.whitelist.splice(index, 1);
            }
        }
    }

    changeName({ newName }) {
        console.warn(`§b${this.name}§f §erenamed to§f §b${newName}§f`);

        this.name = newName;
    }

    changeColor({ color }) {
        if (!this.colors.includes(color)) {
            console.warn(`§b${color}§f §eis not a supported color§f`);
            console.warn(
                `§eSupported color list:§f §b${this.colors.toString()}§f`
            );
        } else {
            this.color = color;
        }
    }

    changeType({ type }) {
        if (type != "private" && type != "public") {
            console.warn(
                "§eWaypoint type only accepts§f §b'private'§f or §b'public'§f"
            );
        } else {
            this.type = type;
        }
    }
}