(() => {
  'use strict';

  class AssetManager {
    constructor() {
      this.sheets = new Map();
      this.pending = new Map();
    }

    loadSpriteSheet(id, source, frames, options = {}) {
      if (this.pending.has(id)) return this.pending.get(id);
      const promise = new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = 'async';
        image.crossOrigin = options.crossOrigin || null;
        image.onload = () => {
          const sheet = {
            id,
            image,
            frames: this.normalizeFrames(frames),
            pixelRatio: options.pixelRatio || 1
          };
          this.sheets.set(id, sheet);
          resolve(sheet);
        };
        image.onerror = () => reject(new Error(`Unable to load sprite sheet: ${source}`));
        image.src = source;
      });
      this.pending.set(id, promise);
      return promise;
    }

    normalizeFrames(config) {
      const source = config.frames || config;
      const result = new Map();
      for (const [name, raw] of Object.entries(source)) {
        const frame = raw.frame || raw;
        result.set(name, {
          x: Number(frame.x) || 0,
          y: Number(frame.y) || 0,
          width: Number(frame.width ?? frame.w) || 1,
          height: Number(frame.height ?? frame.h) || 1,
          pivotX: Number(raw.pivot?.x ?? raw.pivotX ?? 0.5),
          pivotY: Number(raw.pivot?.y ?? raw.pivotY ?? 0.5),
          rotated: Boolean(raw.rotated)
        });
      }
      return result;
    }

    has(sheetId, frameId) {
      return Boolean(this.sheets.get(sheetId)?.frames.has(frameId));
    }

    draw(ctx, sheetId, frameId, x, y, options = {}) {
      const sheet = this.sheets.get(sheetId);
      const frame = sheet?.frames.get(frameId);
      if (!sheet || !frame) return false;
      const scale = options.scale ?? 1;
      const width = options.width ?? frame.width * scale / sheet.pixelRatio;
      const height = options.height ?? frame.height * scale / sheet.pixelRatio;
      const alpha = options.alpha ?? 1;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(options.rotation || 0);
      ctx.scale(options.flipX ? -1 : 1, options.flipY ? -1 : 1);
      ctx.globalAlpha *= alpha;
      if (options.filter) ctx.filter = options.filter;
      if (options.blend) ctx.globalCompositeOperation = options.blend;
      if (options.shadowColor) {
        ctx.shadowColor = options.shadowColor;
        ctx.shadowBlur = options.shadowBlur ?? 12;
      }
      const dx = -width * (options.pivotX ?? frame.pivotX);
      const dy = -height * (options.pivotY ?? frame.pivotY);
      if (frame.rotated) {
        ctx.rotate(-Math.PI / 2);
        ctx.drawImage(sheet.image, frame.x, frame.y, frame.height, frame.width, dy, dx, height, width);
      } else {
        ctx.drawImage(sheet.image, frame.x, frame.y, frame.width, frame.height, dx, dy, width, height);
      }
      ctx.restore();
      return true;
    }

    drawWhiteFlash(ctx, sheetId, frameId, x, y, options = {}) {
      return this.draw(ctx, sheetId, frameId, x, y, {
        ...options,
        blend: 'lighter',
        filter: 'brightness(0) invert(1)',
        shadowColor: '#ffffff',
        shadowBlur: options.shadowBlur ?? 18
      });
    }
  }

  window.AssetManager = AssetManager;
})();
