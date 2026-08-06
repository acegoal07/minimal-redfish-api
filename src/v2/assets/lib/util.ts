import { prisma } from '../../../lib/prisma';
import { getValueFromJson } from '../../../lib/util';

async function assetExists(name: string): Promise<boolean> {
   const asset = await prisma.asset.findFirst({
      where: {
         name: name,
         server: {
            isNot: null
         }
      },
      select: {
         id: true
      }
   });

   return asset !== null;
}

function buildBaseAssetSchema(body: {
   name: string;
   group?: number;
   tags: number[];
   paths: { name: string; path: string }[];
}) {
   return {
      name: body.name,
      groupId: body.group,
      tags: {
         connect: body.tags.map((id) => ({ id }))
      },
      paths: {
         createMany: {
            data: body.paths
         }
      }
   };
}

// asset.serializer.ts

function serializeAsset(
   asset: {
      id: number;
      name: string;
      storageId: number | null;
      group: { id: number; name: string } | null;
      tags: { id: number; name: string }[];
      paths: { id: number; name: string; path: string }[];
      jsons: { rawJson: unknown }[];
   },
   extra: Record<string, unknown> = {}
) {
   return {
      id: asset.id,
      name: asset.name,
      ...extra,
      storage: {
         id: asset.storageId
      },
      group: {
         id: asset.group?.id,
         name: asset.group?.name
      },
      tags: asset.tags.map((tag) => ({
         id: tag.id,
         navigation: tag.name
      })),
      paths: asset.paths.map((path) => ({
         id: path.id,
         name: path.name,
         path: path.path,
         value: getValueFromJson(asset.jsons[0]?.rawJson ?? {}, path.path)
      }))
   };
}

const assetInclude = {
   group: true,
   tags: true,
   paths: true,
   jsons: {
      select: {
         rawJson: true
      }
   }
};

export { assetExists, buildBaseAssetSchema, assetInclude, serializeAsset };
