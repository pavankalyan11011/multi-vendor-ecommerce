/**
 * Pipe a storage read stream to an Express download response.
 */
function streamDownload(res, { stream, filename, contentType, contentLength }) {
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${String(filename).replace(/"/g, '')}"`
  );
  if (contentType) res.setHeader('Content-Type', contentType);
  if (contentLength != null) res.setHeader('Content-Length', String(contentLength));

  stream.on('error', (err) => {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: { code: 'DOWNLOAD_FAILED', message: err.message || 'Download failed' },
      });
    } else {
      res.destroy(err);
    }
  });

  stream.pipe(res);
}

module.exports = { streamDownload };
