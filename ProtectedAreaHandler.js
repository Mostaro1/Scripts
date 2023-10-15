import { world, system, Vector, BlockVolumeUtils } from "@minecraft/server";

export class ProtectedAreas {
  constructor() {
    if (!world.getDynamicProperty("protectedAreas")) {
      world.setDynamicProperty("protectedAreas", JSON.stringify([]));
    }
    if (!world.getDynamicProperty("protectedAreasAdmins")) {
      world.setDynamicProperty("protectedAreasAdmins", JSON.stringify([]));
    }
  }

  //GET

  getProtectedAreas() {
    return JSON.parse(world.getDynamicProperty("protectedAreas"));
  }

  getArea({ id }) {
    const protectedAreas = this.getProtectedAreas();

    return protectedAreas.find((area) => area.id == id);
  }

  getAreaWhitelist({ id }) {
    const protectedAreas = this.getProtectedAreas();

    const area = protectedAreas.find((area) => area.id == id);

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
      const isDuplicated = whitelist.some((name) => name == player);

      if (!isDuplicated) {
        whitelist.push(player);

        this.updateAreaWhitelist({ id, data: whitelist });

        console.warn(`§b${player}§f §eadded to ${id} whitelist!§f`);
      }
    }
  }

  addAdmin({ player }) {
    const admins = this.getAdmins();

    const isInAdminList = admins.some((admin) => admin == player);

    if (!isInAdminList) {
      admins.push(player);

      this.updateAdmins({ data: admins });
    }
  }

  setArea({ name, from, to }) {
    const protectedAreas = this.getProtectedAreas();

    const hasDuplicatedId = protectedAreas.find((area) => area.id == name);

    if (hasDuplicatedId) {
      console.warn(
        `§b${name}§f §ename is already in use, try another area name!§f`
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
          z: from.z,
        },
        to: {
          x: to.x,
          y: to.y,
          z: to.z,
        },
      };

      const hasIntersection = protectedAreas.some(
        (area) =>
          BlockVolumeUtils.intersects(
            {
              from: area.from,
              to: area.to,
            },
            {
              from: newArea.from,
              to: newArea.to,
            }
          ) == 2
      );

      if (!hasIntersection) {
        protectedAreas.push(newArea);

        this.update({ data: protectedAreas });

        console.warn(`§b${name}§f §eadded to protected areas!§f`);
      } else {
        console.warn("§eArea is being intersected by another area boundary!");
      }
    } else {
      console.warn("§ePARAMS MUST BE VECTORS");
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

    const area = protectedAreas.find((area) => area.id == id);

    if (area) {
      area.whitelist = data;

      this.update({ data: protectedAreas });
    }
  }

  //DELETE

  deleteArea({ id }) {
    const protectedAreas = this.getProtectedAreas();

    const index = protectedAreas.findIndex((area) => area.id == id);

    if (index > -1) {
      const removedArea = protectedAreas.splice(index, 1);

      console.warn(`§b${removedArea[0].id}§f §edeleted from Protected Areas§f`);

      this.update({ data: protectedAreas });
    }
  }

  deleteAllAreas() {
    const protectedAreas = this.getProtectedAreas();

    protectedAreas.splice(0);

    this.update({ data: protectedAreas });
  }

  clearAreaWhitelist({ id }) {
    const whitelist = this.getAreaWhitelist({ id });

    if (whitelist) {
      whitelist.splice(0);

      this.updateAreaWhitelist({ id, data: whitelist });
    }
  }

  removeAdmin({ player }) {
    const admins = this.getAdmins();

    const isInAdminList = admins.some((admin) => admin == player);

    if (isInAdminList) {
      const index = admins.findIndex((admin) => admin == player);

      if (index > -1) {
        admins.splice(index, 1);

        this.updateAdmins({ data: admins });
      }
    }
  }

  removeAllAdmins() {
    const admins = this.getAdmins();

    admins.splice(0);

    this.updateAdmins({ data: admins });
  }

  areaWhitelistRemove({ id, player }) {
    const whitelist = this.getAreaWhitelist({ id });

    if (whitelist) {
      const isInWhitelist = whitelist.some((name) => name == player);

      if (isInWhitelist) {
        const index = whitelist.findIndex((name) => name == player);

        if (index > -1) {
          whitelist.splice(index, 1);

          this.updateAreaWhitelist({ id, data: whitelist });

          console.warn(`§b${player}§f §eremoved from ${id} whitelist!§f`);
        }
      }
    }
  }
}

const protectedAreas = new ProtectedAreas();

world.beforeEvents.playerBreakBlock.subscribe((data) => {
  const isInside = data.player.getDynamicProperty("vb");

  if (isInside) {
    data.cancel = true;
  }
});

world.beforeEvents.playerPlaceBlock.subscribe((data) => {
  const isInside = data.player.getDynamicProperty("vb");

  if (isInside) {
    data.cancel = true;
  }
});

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
  const isInside = data.player.getDynamicProperty("vb");

  if (isInside) {
    data.cancel = true;
  }
});

system.runInterval(() => {
  const players = world.getAllPlayers();

  for (let player of players) {
    const face = player.getBlockFromViewDirection()?.face;

    let block;

    const MAX_DISTANCE = {
      maxDistance: 64,
    };
    switch (face) {
      case "Up": {
        block = player.getBlockFromViewDirection(MAX_DISTANCE)?.block?.above();
        break;
      }
      case "Down": {
        block = player.getBlockFromViewDirection(MAX_DISTANCE)?.block?.below();
        break;
      }
      case "North": {
        block = player.getBlockFromViewDirection(MAX_DISTANCE)?.block?.north();
        break;
      }
      case "South": {
        block = player.getBlockFromViewDirection(MAX_DISTANCE)?.block?.south();
        break;
      }
      case "East": {
        block = player.getBlockFromViewDirection(MAX_DISTANCE)?.block?.east();
        break;
      }
      case "West": {
        block = player.getBlockFromViewDirection(MAX_DISTANCE)?.block?.west();
        break;
      }
    }

    if (block && block.isValid()) {
      const isAdmin = protectedAreas
        .getAdmins()
        .some((admin) => admin == player.name);

      const isInside = protectedAreas.getProtectedAreas().some((area) =>
        BlockVolumeUtils.isInside(
          {
            from: protectedAreas.getArea({ id: area.id }).from,
            to: protectedAreas.getArea({ id: area.id }).to,
          },
          block.location
        )
      );

      const area = protectedAreas.getProtectedAreas().find((area) =>
        BlockVolumeUtils.isInside(
          {
            from: protectedAreas.getArea({ id: area.id }).from,
            to: protectedAreas.getArea({ id: area.id }).to,
          },
          block.location
        )
      );

      if (area) {
        if (isAdmin) {
          player.setDynamicProperty("vb", false);
        } else if (area.whitelist.includes(player.name)) {
          player.setDynamicProperty("vb", false);
        } else {
          player.setDynamicProperty("vb", isInside);
        }
      } else {
        player.setDynamicProperty("vb", isInside);
      }
    }
  }
});
