"use strict";
function isWebgl2(gl) {
    return gl.texStorage3D !== undefined;
}
class PixelFormats {
    constructor(gl) {
        this.gl = gl;
        this.EXT_texture_float = gl.getExtension('OES_texture_float');
        this.EXT_texture_half_float = gl.getExtension('OES_texture_half_float');
        this.EXT_texture_half_float_linear = gl.getExtension('OES_texture_half_float_linear');
        this.EXT_texture_float_linear = gl.getExtension('OES_texture_float_linear');
        this.EXT_color_buffer_float = gl.getExtension('EXT_color_buffer_float');
        this.EXT_color_buffer_half_float = gl.getExtension('EXT_color_buffer_half_float');
        this.WEBGL_depth_texture = gl.getExtension('WEBGL_depth_texture') ||
            gl.getExtension('WEBKIT_WEBGL_depth_texture') ||
            gl.getExtension('MOZ_WEBGL_depth_texture');
        const agl = gl;
        const gl2 = gl;
        if (gl2.HALF_FLOAT === undefined && this.EXT_texture_half_float) {
            agl.HALF_FLOAT = this.EXT_texture_half_float.HALF_FLOAT_OES;
        }
        if (gl2.UNSIGNED_INT_24_8 === undefined && this.WEBGL_depth_texture) {
            agl.UNSIGNED_INT_24_8 = 0x84FA;
        }
        this._availables = {};
        this._renderables = {};
        this.RGB8 = FMT(gl.RGB, gl2.RGB, gl2.UNSIGNED_BYTE);
        this.RGBA8 = FMT(gl.RGBA, gl2.RGBA, gl2.UNSIGNED_BYTE);
        this.RGB32F = FMT(gl.RGB, gl2.RGB32F, gl2.FLOAT);
        this.RGBA32F = FMT(gl.RGBA, gl2.RGBA32F, gl2.FLOAT);
        this.RGB16F = FMT(gl.RGB, gl2.RGB16F, gl2.HALF_FLOAT);
        this.RGBA16F = FMT(gl.RGBA, gl2.RGBA16F, gl2.HALF_FLOAT);
        this.A2B10G10R10 = FMT(gl.RGBA, gl2.RGB10_A2, gl2.UNSIGNED_INT_2_10_10_10_REV);
    }
    static getInstance(gl) {
        const agl = gl;
        var pf = agl.__pf;
        if (pf === undefined) {
            agl.__pf = pf = new PixelFormats(gl);
        }
        return pf;
    }
    dispose() {
        this.EXT_texture_float = null;
        this.EXT_texture_half_float = null;
        this.EXT_texture_half_float_linear = null;
        this.EXT_texture_float_linear = null;
        this.EXT_color_buffer_float = null;
        this.EXT_color_buffer_half_float = null;
        const agl = this.gl;
        if (agl.__pf === this) {
            delete agl.__pf;
        }
    }
    hasDepthTexture() {
        if (isWebgl2(this.gl))
            return this.isAvailable(this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT, this.gl.DEPTH_COMPONENT24);
        else
            return this.isAvailable(this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT, this.gl.DEPTH_COMPONENT);
    }
    isAvailable(format, type, internal) {
        if (format === undefined || type === undefined) {
            return false;
        }
        if (internal === undefined) {
            internal = format;
        }
        var cid = _hashPF(format, type, internal);
        if (this._availables[cid] === undefined) {
            this._availables[cid] = this._testAvailable(format, type, internal);
        }
        return this._availables[cid];
    }
    isRenderable(format, type, internal) {
        if (format === undefined || type === undefined) {
            return false;
        }
        if (internal === undefined) {
            internal = format;
        }
        const cid = _hashPF(format, type, internal);
        if (this._renderables[cid] === undefined) {
            const available = this.isAvailable(format, type, internal);
            this._renderables[cid] = available && this._testRenderable(format, type, internal);
        }
        return this._renderables[cid];
    }
    getRenderableFormat(configs) {
        for (var i = 0; i < configs.length; i++) {
            var cfg = configs[i];
            if (this.isRenderable(cfg.format, cfg.type, cfg.internal)) {
                return cfg;
            }
        }
        return null;
    }
    _testAvailable(format, type, internal) {
        const gl = this.gl;
        gl.getError();
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null);
        gl.deleteTexture(tex);
        return (gl.getError() === 0);
    }
    _testRenderable(format, type, internal) {
        const gl = this.gl;
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null);
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        const ok = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.deleteTexture(tex);
        gl.deleteFramebuffer(fbo);
        return ok;
    }
}
function FMT(format, internal, type) {
    return {
        format: format,
        internal: internal,
        type: type
    };
}
function _hashPF(format, internal, type) {
    return format ^ (internal << 8) ^ (type << 16);
}
module.exports = PixelFormats;
