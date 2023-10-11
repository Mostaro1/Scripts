import { world, system, Vector, BlockVolumeUtils } from "@minecraft/server";

export class ProtectedAreas {
  constructor() {
    if (!world.getDynamicProperty("protectedAreas")) {
      world.setDynamicProperty("protectedAreas", JSON.stringify([]));
    }
  }

  getProtectedAreas() {
    return JSON.parse(world.getDynamicProperty("protectedAreas"));
  }

  getArea({ name }) {
    const protectedAreas = this.getProtectedAreas();

    return protectedAreas.find((area) => area.id == name);
  }

  setArea({ name, from, to }) {
    const protectedAreas = this.getProtectedAreas();

    const isDuplicated = protectedAreas.find((area) => area.id == name);

    if (isDuplicated) {
      console.warn(
        `§d${name}§f name is already in use, try another area name!`
      );
      return;
    }

    if (from instanceof Vector && to instanceof Vector) {
      const area = {
        id: name,
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

      protectedAreas.push(area);

      this.update({ data: protectedAreas });

      console.warn(`§d${name}§f added to protected areas!`);
    } else {
      console.warn("§ePARAMS MUST BE VECTORS");
    }
  }

  update({ data }) {
    const stringify = JSON.stringify(data);

    world.setDynamicProperty("protectedAreas", stringify);
  }

  deleteArea({ id }) {
    const protectedAreas = this.getProtectedAreas();

    const index = protectedAreas.findIndex((area) => area.id == id);

    if (index > -1) {
      const removedArea = protectedAreas.splice(index, 1);

      console.warn(`§d${removedArea[0].id}§f deleted from Protected Areas`);

      this.update({ data: protectedAreas });
    }
  }

  deleteAllAreas() {
    const protectedAreas = this.getProtectedAreas();

    protectedAreas.splice(0);

    this.update({ data: protectedAreas });
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
      const isInside = protectedAreas.getProtectedAreas().some((area) =>
        BlockVolumeUtils.isInside(
          {
            from: protectedAreas.getArea({ name: area.id }).from,
            to: protectedAreas.getArea({ name: area.id }).to,
          },
          block.location
        )
      );

      player.setDynamicProperty("vb", isInside);
    }
  }
});
