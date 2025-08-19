import type { EpisodeGroup } from '../entities/episodeGroup';
import { groupTreeHelper } from './groupTreeHelper';

describe('groupTreeHelper', () => {
  const allGroups: readonly EpisodeGroup[] = [
    { id: 1, name: 'Root 1', parentId: null, children: [], displayOrder: 0, groupType: 'folder' },
    { id: 2, name: 'Root 2', parentId: null, children: [], displayOrder: 1, groupType: 'folder' },
    { id: 3, name: 'Child 1.1', parentId: 1, children: [], displayOrder: 0, groupType: 'folder' },
    { id: 4, name: 'Child 1.2', parentId: 1, children: [], displayOrder: 1, groupType: 'folder' },
    {
      id: 5,
      name: 'Grandchild 1.1.1',
      parentId: 3,
      children: [],
      displayOrder: 0,
      groupType: 'folder',
    },
    {
      id: 6,
      name: 'Grandchild 1.2.1',
      parentId: 4,
      children: [],
      displayOrder: 0,
      groupType: 'folder',
    },
    { id: 7, name: 'Child 2.1', parentId: 2, children: [], displayOrder: 0, groupType: 'folder' },
    {
      id: 8,
      name: 'Empty Root',
      parentId: null,
      children: [],
      displayOrder: 2,
      groupType: 'folder',
    },
  ];

  describe('findDescendantIds', () => {
    it('should return all descendant IDs for a given group', () => {
      const descendantIds = groupTreeHelper.findDescendantIds(1, allGroups);
      // 子(3, 4)と孫(5, 6)が含まれるべき
      expect(descendantIds).toEqual(expect.arrayContaining([3, 4, 5, 6]));
      expect(descendantIds.length).toBe(4);
    });

    it('should return descendant IDs for a mid-level group', () => {
      const descendantIds = groupTreeHelper.findDescendantIds(3, allGroups);
      expect(descendantIds).toEqual([5]);
    });

    it('should return an empty array for a group with no descendants', () => {
      const descendantIds = groupTreeHelper.findDescendantIds(5, allGroups);
      expect(descendantIds).toEqual([]);
    });

    it('should return an empty array for a group that does not exist', () => {
      const descendantIds = groupTreeHelper.findDescendantIds(99, allGroups);
      expect(descendantIds).toEqual([]);
    });

    it('should handle complex nested structures', () => {
      const complexGroups: readonly EpisodeGroup[] = [
        ...allGroups,
        {
          id: 9,
          name: 'Great-grandchild',
          parentId: 5,
          children: [],
          displayOrder: 0,
          groupType: 'folder',
        },
        {
          id: 10,
          name: 'Another child',
          parentId: 1,
          children: [],
          displayOrder: 2,
          groupType: 'folder',
        },
      ];
      const descendantIds = groupTreeHelper.findDescendantIds(1, complexGroups);
      expect(descendantIds).toEqual(expect.arrayContaining([3, 4, 5, 6, 9, 10]));
      expect(descendantIds.length).toBe(6);
    });

    it('should return an empty array if the allGroups array is empty', () => {
      const descendantIds = groupTreeHelper.findDescendantIds(1, []);
      expect(descendantIds).toEqual([]);
    });
  });
});
