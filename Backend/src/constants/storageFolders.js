/** Logical folders inside local uploads/ or S3 bucket prefix. */
const STORAGE_FOLDERS = Object.freeze({
  VENDOR_DOCS: 'vendor-docs',
  PRODUCT_IMAGES: 'product-images',
  CATEGORY_IMAGES: 'category-images',
});

const STORAGE_FOLDER_VALUES = Object.freeze(Object.values(STORAGE_FOLDERS));

module.exports = { STORAGE_FOLDERS, STORAGE_FOLDER_VALUES };
