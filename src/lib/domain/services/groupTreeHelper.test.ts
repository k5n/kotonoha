import type { EpisodeGroup } from '../entities/episodeGroup';
import { groupTreeHelper } from './groupTreeHelper';

describe('groupTreeHelper', () => {
  const allGroups: readonly EpisodeGroup[] = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Root 1',
      parentId: null,
      children: [],
      displayOrder: 0,
      groupType: 'folder',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Root 2',
      parentId: null,
      children: [],
      displayOrder: 1,
      groupType: 'folder',
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Child 1.1',
      parentId: '00000000-0000-0000-0000-000000000001',
      children: [],
      displayOrder: 0,
      groupType: 'folder',
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'Child 1.2',
      parentId: '00000000-0000-0000-0000-000000000001',
      children: [],
      displayOrder: 1,
      groupType: 'folder',
    },
    {
      id: '00000000-0000-0000-0000-000000000005',
      name: 'Grandchild 1.1.1',
      parentId: '00000000-0000-0000-0000-000000000003',
      children: [],
      displayOrder: 0,
      groupType: 'folder',
    },
    {
      id: '00000000-0000-0000-0000-000000000006',
      name: 'Grandchild 1.2.1',
      parentId: '00000000-0000-0000-0000-000000000004',
      children: [],
      displayOrder: 0,
      groupType: 'folder',
    },
    {
      id: '00000000-0000-0000-0000-000000000007',
      name: 'Child 2.1',
      parentId: '00000000-0000-0000-0000-000000000002',
      children: [],
      displayOrder: 0,
      groupType: 'folder',
    },
    {
      id: '00000000-0000-0000-0000-000000000008',
      name: 'Empty Root',
      parentId: null,
      children: [],
      displayOrder: 2,
      groupType: 'folder',
    },
  ];

  describe('findDescendantIds', () => {
    it('should return all descendant IDs for a given group', () => {
      const descendantIds = groupTreeHelper.findDescendantIds(
        '00000000-0000-0000-0000-000000000001',
        allGroups
      );
      // 子(3, 4)と孫(5, 6)が含まれるべき
      expect(descendantIds).toEqual(
        expect.arrayContaining([
          '00000000-0000-0000-0000-000000000003',
          '00000000-0000-0000-0000-000000000004',
          '00000000-0000-0000-0000-000000000005',
          '00000000-0000-0000-0000-000000000006',
        ])
      );
      expect(descendantIds.length).toBe(4);
    });

    it('should return descendant IDs for a mid-level group', () => {
      const descendantIds = groupTreeHelper.findDescendantIds(
        '00000000-0000-0000-0000-000000000003',
        allGroups
      );
      expect(descendantIds).toEqual(['00000000-0000-0000-0000-000000000005']);
    });

    it('should return an empty array for a group with no descendants', () => {
      const descendantIds = groupTreeHelper.findDescendantIds(
        '00000000-0000-0000-0000-000000000005',
        allGroups
      );
      expect(descendantIds).toEqual([]);
    });

    it('should return an empty array for a group that does not exist', () => {
      const descendantIds = groupTreeHelper.findDescendantIds(
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        allGroups
      );
      expect(descendantIds).toEqual([]);
    });

    it('should handle complex nested structures', () => {
      const complexGroups: readonly EpisodeGroup[] = [
        ...allGroups,
        {
          id: '00000000-0000-0000-0000-000000000009',
          name: 'Great-grandchild',
          parentId: '00000000-0000-0000-0000-000000000005',
          children: [],
          displayOrder: 0,
          groupType: 'folder',
        },
        {
          id: '00000000-0000-0000-0000-000000000010',
          name: 'Another child',
          parentId: '00000000-0000-0000-0000-000000000001',
          children: [],
          displayOrder: 2,
          groupType: 'folder',
        },
      ];
      const descendantIds = groupTreeHelper.findDescendantIds(
        '00000000-0000-0000-0000-000000000001',
        complexGroups
      );
      expect(descendantIds).toEqual(
        expect.arrayContaining([
          '00000000-0000-0000-0000-000000000003',
          '00000000-0000-0000-0000-000000000004',
          '00000000-0000-0000-0000-000000000005',
          '00000000-0000-0000-0000-000000000006',
          '00000000-0000-0000-0000-000000000009',
          '00000000-0000-0000-0000-000000000010',
        ])
      );
      expect(descendantIds.length).toBe(6);
    });

    it('should return an empty array if the allGroups array is empty', () => {
      const descendantIds = groupTreeHelper.findDescendantIds(
        '00000000-0000-0000-0000-000000000001',
        []
      );
      expect(descendantIds).toEqual([]);
    });
  });
});
