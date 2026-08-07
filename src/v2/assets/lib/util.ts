import { getValueFromJson } from '../../../lib/util';

function buildBaseAssetSchema(body: {
   name: string;
   group?: number;
   tags: number[];
   paths: { name: string; path: string }[];
   json?: string | null;
}) {
   return {
      name: body.name,
      ...(body.group !== undefined && {
         groupId: body.group
      }),
      ...(body.json != null && {
         json: {
            create: {
               rawJson: body.json
            }
         }
      }),
      ...(body.tags.length > 0 && {
         tags: {
            connect: body.tags.map((id) => ({ id }))
         }
      }),
      paths: {
         createMany: {
            data: body.paths
         }
      }
   };
}

function serializeAsset(
   asset: {
      id: number;
      name: string;
      storageId: number | null;
      storage: {
         asset: {
            name: string;
         };
      } | null;
      group: { id: number; name: string } | null;
      tags: { id: number; name: string }[];
      paths: { id: number; name: string; path: string }[];
      json: { rawJson: string; id: number }[];
      jsonPosition: number | null;
      _count: { json: number };
   },
   extra: Record<string, unknown> = {}
) {
   return {
      id: asset.id,
      name: asset.name,
      ...extra,
      storage: {
         id: asset.storageId,
         name: asset.storage?.asset.name
      },
      group: {
         id: asset.group?.id,
         name: asset.group?.name
      },
      tags: asset.tags.map((tag) => ({
         id: tag.id,
         navigation: tag.name
      })),
      paths: asset.paths.map((path) => {
         return serializePath(path, asset.json[0]?.rawJson);
      }),
      json: asset.json[0]
         ? {
              id: asset.json[0].id,
              rawJson: asset.json[0].rawJson,
              position: asset.jsonPosition,
              total: asset._count.json
           }
         : null
   };
}

function serializePath(
   path: {
      id: number;
      name: string;
      path: string;
   },
   json: string | null
) {
   return {
      id: path.id,
      name: path.name,
      path: path.path,
      value: getValueFromJson(json ?? '{}', path.path)
   };
}

const assetInclude = {
   group: true,
   tags: true,
   paths: true,
   json: {
      select: {
         id: true,
         rawJson: true
      },
      orderBy: {
         uploadDate: 'desc' as const
      },
      take: 1
   },
   storage: {
      include: {
         asset: {
            select: {
               name: true
            }
         }
      }
   },
   _count: {
      select: {
         json: true
      }
   }
};

export { buildBaseAssetSchema, assetInclude, serializeAsset, serializePath };
