import { Room } from 'colyseus';
import { DungeonState, Entity } from '../schema/DungeonStateSchema.js';
import { GRID_SIZE } from '../utils/grid.js';
import { consumeSessionAccessTicket } from '../sessionAccess.js';
export class DungeonRoom extends Room {
    maxClients = 16;
    dmSessionId = null;
    roomSessionId = null;
    clientRoles = new Map();
    get ds() {
        return this.state;
    }
    onCreate(options) {
        if (!options.sessionId) {
            throw new Error('DungeonRoom requires a sessionId.');
        }
        this.roomSessionId = options.sessionId;
        this.setState(new DungeonState());
        this.setPatchRate(50);
        this.onMessage('uploadMap', (client, json) => {
            if (!this.isDM(client))
                return;
            try {
                JSON.parse(json);
                this.ds.mapJson = json;
                this.broadcast('mapSync', json, { except: client });
            }
            catch {
                client.send('error', 'Invalid dungeon JSON');
            }
        });
        this.onMessage('mapUpdate', (client, json) => {
            if (!this.isDM(client))
                return;
            this.ds.mapJson = json;
            this.broadcast('mapSync', json, { except: client });
        });
        this.onMessage('placeToken', (client, msg) => {
            if (!this.isDM(client))
                return;
            const entity = new Entity();
            entity.id = msg.id;
            entity.type = msg.type;
            entity.cellX = msg.cellX;
            entity.cellZ = msg.cellZ;
            entity.worldX = (msg.cellX + 0.5) * GRID_SIZE;
            entity.worldZ = (msg.cellZ + 0.5) * GRID_SIZE;
            entity.name = msg.name;
            entity.assetId = msg.assetId;
            entity.visibleToPlayers = true;
            this.ds.entities.set(entity.id, entity);
        });
        this.onMessage('removeToken', (client, msg) => {
            if (!this.isDM(client))
                return;
            this.ds.entities.delete(msg.entityId);
        });
        this.onMessage('toggleVisible', (client, msg) => {
            if (!this.isDM(client))
                return;
            const entity = this.ds.entities.get(msg.entityId);
            if (entity)
                entity.visibleToPlayers = msg.visible;
        });
        this.onMessage('requestMove', (client, msg) => {
            const entity = this.ds.entities.get(msg.entityId);
            if (!entity)
                return;
            if (entity.type === 'NPC' && !this.isDM(client))
                return;
            const wallGrid = this.getWallGrid();
            const path = this.bfsPath([entity.cellX, entity.cellZ], msg.targetCell, wallGrid);
            if (path === null || path > entity.movementRange) {
                client.send('moveDenied', { entityId: msg.entityId, reason: 'out_of_range' });
                return;
            }
            this.applyMove(entity, msg.targetCell);
            this.broadcastLoSFilter();
        });
        this.onMessage('forceMoveEntity', (client, msg) => {
            if (!this.isDM(client))
                return;
            const entity = this.ds.entities.get(msg.entityId);
            if (!entity)
                return;
            this.applyMove(entity, msg.targetCell);
            this.broadcastLoSFilter();
        });
        this.onMessage('patchEntity', (client, msg) => {
            if (!this.isDM(client))
                return;
            const entity = this.ds.entities.get(msg.entityId);
            if (!entity)
                return;
            if (msg.patch.name !== undefined)
                entity.name = msg.patch.name;
            if (msg.patch.movementRange !== undefined)
                entity.movementRange = msg.patch.movementRange;
            if (msg.patch.type !== undefined)
                entity.type = msg.patch.type;
        });
    }
    async onAuth(_client, options) {
        if (!options.sessionId || !options.accessToken) {
            throw new Error('Session access requires both sessionId and accessToken.');
        }
        if (this.roomSessionId !== null && options.sessionId !== this.roomSessionId) {
            throw new Error('Session mismatch.');
        }
        const access = await consumeSessionAccessTicket(options.sessionId, options.accessToken);
        if (this.roomSessionId !== null && access.sessionId !== this.roomSessionId) {
            throw new Error('Session mismatch.');
        }
        return access;
    }
    onJoin(client, _options, auth) {
        this.clientRoles.set(client.sessionId, auth.role);
        if (auth.role === 'dm') {
            this.dmSessionId = client.sessionId;
            this.ds.dmSessionId = client.sessionId;
        }
        console.log(`[DungeonRoom] ${auth.role} joined session ${auth.sessionId}: ${client.sessionId}`);
        if (this.ds.mapJson) {
            client.send('mapSync', this.ds.mapJson);
        }
    }
    onLeave(client) {
        console.log(`[DungeonRoom] client left: ${client.sessionId}`);
        this.clientRoles.delete(client.sessionId);
        if (client.sessionId === this.dmSessionId) {
            this.dmSessionId = null;
            this.ds.dmSessionId = '';
        }
    }
    onDispose() {
        console.log('[DungeonRoom] room disposed');
    }
    broadcastLoSFilter() {
        const losRadius = 10;
        const players = Array.from(this.ds.entities.values()).filter((entity) => entity.type === 'PLAYER');
        const visibleNpcIds = new Set();
        for (const [id, entity] of this.ds.entities) {
            if (entity.type !== 'NPC' || !entity.visibleToPlayers)
                continue;
            for (const player of players) {
                const dx = player.cellX - entity.cellX;
                const dz = player.cellZ - entity.cellZ;
                if (dx * dx + dz * dz <= losRadius * losRadius) {
                    visibleNpcIds.add(id);
                    break;
                }
            }
        }
        for (const client of this.clients) {
            if (this.isDM(client))
                continue;
            client.send('losUpdate', { visibleNpcIds: Array.from(visibleNpcIds) });
        }
    }
    isDM(client) {
        return this.clientRoles.get(client.sessionId) === 'dm';
    }
    applyMove(entity, targetCell) {
        entity.cellX = targetCell[0];
        entity.cellZ = targetCell[1];
        entity.worldX = (targetCell[0] + 0.5) * GRID_SIZE;
        entity.worldZ = (targetCell[1] + 0.5) * GRID_SIZE;
    }
    getWallGrid() {
        try {
            const file = JSON.parse(this.ds.mapJson);
            const activeFloor = file.floors.find((floor) => floor.id === file.activeFloorId);
            if (!activeFloor)
                return () => true;
            const painted = new Set(activeFloor.cells.map((cell) => `${cell.x}:${cell.z}`));
            return (x, z) => !painted.has(`${x}:${z}`);
        }
        catch {
            return () => false;
        }
    }
    bfsPath(from, to, isBlocked) {
        if (from[0] === to[0] && from[1] === to[1])
            return 0;
        if (isBlocked(to[0], to[1]))
            return null;
        const visited = new Set();
        const queue = [{ pos: from, dist: 0 }];
        visited.add(`${from[0]}:${from[1]}`);
        while (queue.length > 0) {
            const { pos, dist } = queue.shift();
            for (const [dx, dz] of [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
            ]) {
                const nx = pos[0] + dx;
                const nz = pos[1] + dz;
                const key = `${nx}:${nz}`;
                if (visited.has(key))
                    continue;
                if (isBlocked(nx, nz))
                    continue;
                if (nx === to[0] && nz === to[1])
                    return dist + 1;
                visited.add(key);
                queue.push({ pos: [nx, nz], dist: dist + 1 });
            }
        }
        return null;
    }
}
