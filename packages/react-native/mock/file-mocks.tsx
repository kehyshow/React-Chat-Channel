export const requestMediaLibraryPermissionMock = jest.fn(() => Promise.resolve({ granted: true }));

export const EXPO_MEDIA_LIBRARY_MOCK = {
  ...jest.requireActual("expo-media-library"),
  usePermissions: jest.fn(() => [
    { granted: true },
    requestMediaLibraryPermissionMock,
    jest.fn(() => Promise.resolve({ granted: true })),
  ]),
  createAssetAsync: jest.fn(() => Promise.resolve({})),
  getAlbumAsync: jest.fn(() => Promise.resolve(null)),
  createAlbumAsync: jest.fn(() => Promise.resolve({})),
  addAssetsToAlbumAsync: jest.fn(() => Promise.resolve({})),
};

export const EXPO_SHARING_MOCK = {
  ...jest.requireActual("expo-sharing"),
  shareAsync: jest.fn(() => Promise.resolve()),
};

export const EXPO_FILE_SYSTEM_MOCK = {
  ...jest.requireActual("expo-file-system"),
  StorageAccessFramework: {
    ...jest.requireActual("expo-file-system").StorageAccessFramework,
    requestDirectoryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
    createFileAsync: jest.fn(() => Promise.resolve("Some/uri")),
  },
  readAsStringAsync: jest.fn(() => Promise.resolve("Hello")),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  createDownloadResumable: jest.fn(() => {
    return {
      downloadAsync: () =>
        Promise.resolve({
          uri: "",
          status: 200,
          headers: {},
        }),
    };
  }),
};
