import * as FileSystem from 'expo-file-system/legacy';

const RECORDINGS_DIR_NAME = 'cat-recordings';
const RECORDINGS_DIRECTORY = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}${RECORDINGS_DIR_NAME}/`
  : null;

function isDurableRecordingUri(uri: string): boolean {
  return Boolean(RECORDINGS_DIRECTORY && uri.startsWith(RECORDINGS_DIRECTORY));
}

function getFileExtension(uri: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? `.${match[1].toLowerCase()}` : '.m4a';
}

function createRecordingFileName(sourceUri: string): string {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `cat-recording-${Date.now()}-${randomPart}${getFileExtension(sourceUri)}`;
}

export async function ensureRecordingsDirectory(): Promise<string | null> {
  if (!RECORDINGS_DIRECTORY) return null;

  const info = await FileSystem.getInfoAsync(RECORDINGS_DIRECTORY);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(RECORDINGS_DIRECTORY, { intermediates: true });
  }

  return RECORDINGS_DIRECTORY;
}

export async function persistRecordingFile(sourceUri?: string): Promise<string | undefined> {
  if (!sourceUri) return undefined;

  try {
    if (isDurableRecordingUri(sourceUri)) {
      return sourceUri;
    }

    const sourceInfo = await FileSystem.getInfoAsync(sourceUri);
    if (!sourceInfo.exists) {
      return sourceUri;
    }

    const directory = await ensureRecordingsDirectory();
    if (!directory) return sourceUri;

    const destinationUri = `${directory}${createRecordingFileName(sourceUri)}`;
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });
    return destinationUri;
  } catch {
    return sourceUri;
  }
}

export async function recordingFileExists(uri?: string): Promise<boolean> {
  if (!uri) return false;

  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}

/*
Durable local cat recordings:
- Files are copied into app-local document storage under `cat-recordings/`
- `recordingUri` in the log should point to that durable copy for new recordings
- If a URI is already pointing at the durable directory, it is reused as-is
- Older or missing paths fail safely and cat-to-human replay is skipped
- This is local-only storage and does not yet include cleanup / export / sync behavior
*/
