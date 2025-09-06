import path from 'node:path';

export const ROOT_DIR = process.cwd();
export const CONTENT_DIR = path.join(ROOT_DIR, 'content');
export const STORIES_DIR = path.join(CONTENT_DIR, 'stories');
export const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
export const TOPICS_FILE = path.join(CONTENT_DIR, 'topics.json');
