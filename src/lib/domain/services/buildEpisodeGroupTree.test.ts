import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { buildEpisodeGroupTree } from './buildEpisodeGroupTree';

describe('buildEpisodeGroupTree', () => {
  it('returns a single root group with no children', () => {
    const flat: EpisodeGroup[] = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'root',
        displayOrder: 1,
        parentId: null,
        groupType: 'folder',
        children: [],
      },
    ];
    const tree = buildEpisodeGroupTree(flat);
    expect(tree).toEqual([
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'root',
        displayOrder: 1,
        parentId: null,
        groupType: 'folder',
        children: [],
      },
    ]);
  });

  it('nests children under their parent', () => {
    const flat: EpisodeGroup[] = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'parent',
        displayOrder: 1,
        parentId: null,
        groupType: 'folder',
        children: [],
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'child1',
        displayOrder: 2,
        parentId: '00000000-0000-0000-0000-000000000001',
        groupType: 'album',
        children: [],
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'child2',
        displayOrder: 1,
        parentId: '00000000-0000-0000-0000-000000000001',
        groupType: 'album',
        children: [],
      },
    ];
    const tree = buildEpisodeGroupTree(flat);
    expect(tree).toEqual([
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'parent',
        displayOrder: 1,
        parentId: null,
        groupType: 'folder',
        children: [
          {
            id: '00000000-0000-0000-0000-000000000003',
            name: 'child2',
            displayOrder: 1,
            parentId: '00000000-0000-0000-0000-000000000001',
            groupType: 'album',
            children: [],
          },
          {
            id: '00000000-0000-0000-0000-000000000002',
            name: 'child1',
            displayOrder: 2,
            parentId: '00000000-0000-0000-0000-000000000001',
            groupType: 'album',
            children: [],
          },
        ],
      },
    ]);
  });

  it('handles multi-level nesting', () => {
    const flat: EpisodeGroup[] = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'root',
        displayOrder: 1,
        parentId: null,
        groupType: 'folder',
        children: [],
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'child',
        displayOrder: 1,
        parentId: '00000000-0000-0000-0000-000000000001',
        groupType: 'folder',
        children: [],
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'grandchild',
        displayOrder: 1,
        parentId: '00000000-0000-0000-0000-000000000002',
        groupType: 'album',
        children: [],
      },
    ];
    const tree = buildEpisodeGroupTree(flat);
    expect(tree).toEqual([
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'root',
        displayOrder: 1,
        parentId: null,
        groupType: 'folder',
        children: [
          {
            id: '00000000-0000-0000-0000-000000000002',
            name: 'child',
            displayOrder: 1,
            parentId: '00000000-0000-0000-0000-000000000001',
            groupType: 'folder',
            children: [
              {
                id: '00000000-0000-0000-0000-000000000003',
                name: 'grandchild',
                displayOrder: 1,
                parentId: '00000000-0000-0000-0000-000000000002',
                groupType: 'album',
                children: [],
              },
            ],
          },
        ],
      },
    ]);
  });

  it('sorts children by displayOrder', () => {
    const flat: EpisodeGroup[] = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'parent',
        displayOrder: 1,
        parentId: null,
        groupType: 'folder',
        children: [],
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'child2',
        displayOrder: 2,
        parentId: '00000000-0000-0000-0000-000000000001',
        groupType: 'album',
        children: [],
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'child1',
        displayOrder: 1,
        parentId: '00000000-0000-0000-0000-000000000001',
        groupType: 'album',
        children: [],
      },
    ];
    const tree = buildEpisodeGroupTree(flat);
    expect(tree[0].children[0].name).toBe('child1');
    expect(tree[0].children[1].name).toBe('child2');
  });

  it('treats groups with missing parent as root', () => {
    const flat: EpisodeGroup[] = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'orphan',
        displayOrder: 1,
        parentId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        groupType: 'album',
        children: [],
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'root',
        displayOrder: 2,
        parentId: null,
        groupType: 'folder',
        children: [],
      },
    ];
    const tree = buildEpisodeGroupTree(flat);
    expect(tree.length).toBe(2);
    expect(tree.find((g) => g.id === '00000000-0000-0000-0000-000000000001')).toBeDefined();
    expect(tree.find((g) => g.id === '00000000-0000-0000-0000-000000000002')).toBeDefined();
  });
});
