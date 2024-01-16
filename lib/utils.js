import { stat } from "fs/promises";

/**
 * Check if file exists
 * @param {string} path 
 * @returns 
 */
export async function is_file_exists(path) {
  try {
    return (await stat(path)).isFile();
  }
  catch (e) {
    return false;
  }
}

/**
 * Check if directory exists
 * @param {string} path 
 * @returns 
 */
export async function is_directory_exists(path) {
  try {
    return (await stat(path)).isDirectory();
  }
  catch (e) {
    return false;
  }
}