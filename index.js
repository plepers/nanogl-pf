
/*
  Provide various pixel-format's related capabilities.
*/



PixelFormats.getInstance = function( gl ){
  var pf = gl.__pf;
  if( pf === undefined ){
    gl.__pf = pf = new PixelFormats( gl );
  }
  return pf;
};





function PixelFormats( gl ){
  this.gl = gl;

  // EXTENSIONS
  // ==========

  this.EXT_texture_float             = gl.getExtension('OES_texture_float'              );
  this.EXT_texture_half_float        = gl.getExtension('OES_texture_half_float'         );
  this.EXT_texture_half_float_linear = gl.getExtension('OES_texture_half_float_linear'  );
  this.EXT_texture_float_linear      = gl.getExtension('OES_texture_float_linear'       );
  this.EXT_color_buffer_float        = gl.getExtension('EXT_color_buffer_float'         );
  this.EXT_color_buffer_half_float   = gl.getExtension('EXT_color_buffer_half_float'    );

  this.WEBGL_depth_texture           = gl.getExtension( 'WEBGL_depth_texture' ) ||
                                       gl.getExtension( 'WEBKIT_WEBGL_depth_texture' ) ||
                                       gl.getExtension( 'MOZ_WEBGL_depth_texture' );

  // NORMALIZATION
  // =============

  // normalize HALF_FLOAT to mimic webgl2 ctx
  if( gl.HALF_FLOAT === undefined && this.EXT_texture_half_float ){
    gl.HALF_FLOAT = this.EXT_texture_half_float.HALF_FLOAT_OES;
  }

  // normalize UNSIGNED_INT_24_8 to mimic webgl2 ctx
  if( gl.UNSIGNED_INT_24_8 === undefined && this.WEBGL_depth_texture ){
    gl.UNSIGNED_INT_24_8 = 0x84FA;
  }

  this._availables = {};
  this._renderables  = {};


  // PRESETS
  // =======

  this.RGB8        = FMT( gl.RGB,   gl.RGB,      gl.UNSIGNED_BYTE                );
  this.RGBA8       = FMT( gl.RGBA,  gl.RGBA,     gl.UNSIGNED_BYTE                );
  this.RGB32F      = FMT( gl.RGB,   gl.RGB32F,   gl.FLOAT                        );
  this.RGBA32F     = FMT( gl.RGBA,  gl.RGBA32F,  gl.FLOAT                        );
  this.RGB16F      = FMT( gl.RGB,   gl.RGB16F,   gl.HALF_FLOAT                   );
  this.RGBA16F     = FMT( gl.RGBA,  gl.RGBA16F,  gl.HALF_FLOAT                   );
  this.A2B10G10R10 = FMT( gl.RGBA,  gl.RGB10_A2, gl.UNSIGNED_INT_2_10_10_10_REV  );

}



PixelFormats.prototype = {

  /**
   * release this instance and its reference in gl context
   * release all extensions
   */
  dispose : function(){

    this.EXT_texture_float             = null;
    this.EXT_texture_half_float        = null;
    this.EXT_texture_half_float_linear = null;
    this.EXT_texture_float_linear      = null;
    this.EXT_color_buffer_float        = null;
    this.EXT_color_buffer_half_float   = null;

    if( this.gl.__pf === this ){
      delete this.gl.__pf;
    }

    this.gl = null;
  },


  /**
   * return true if Texture with depth pixel format can be created.
   */
  hasDepthTexture : function(){
    return this.isAvailable( this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT, this.gl.DEPTH_COMPONENT24 );
  },


  /**
   *  test if texture allocation with given pf leave gl error
   */
  isAvailable : function( format, type, internal ){

    if( format===undefined || type===undefined ){
      return false;
    }

    if( internal === undefined ) {
      internal = format;
    }

    var cid = _hashPF( format, type, internal );
    if( this._availables[cid] === undefined ){
      this._availables[cid] = this._testAvailable( format, type, internal );
    }
    return this._availables[cid];

  },


  /**
   * Test if given format is color renderable
   * Actually est if FBO with given color format is "FRAMEBUFFER_COMPLETE"
   * /!\ can change bound framebuffer and tex
   */
  isRenderable : function( format, type, internal ){

    if( format===undefined || type===undefined ){
      return false;
    }

    if( internal === undefined ) {
      internal = format;
    }

    var cid = _hashPF( format, type, internal );
    if( this._renderables[cid] === undefined ){
      var available = this.isAvailable( format, type, internal );
      this._renderables[cid] = available && this._testRenderable( format, type, internal );
    }
    return this._renderables[cid];

  },


  /**
   * return the first color-renderable format or null if no one is.
   * @param {Object} [configs] Array of object in the form {format,type,internal}
   * /!\ can leave unbinded framebuffer
   */
  getRenderableFormat : function( configs ){

    for (var i = 0; i < configs.length; i++) {
      var cfg = configs[i];
      if( this.isRenderable( cfg.format, cfg.type, cfg.internal ) ) {
        return cfg;
      }
    }

    return null;
  },


  _testAvailable : function( format, type, internal ){
    var gl = this.gl;

    // flush errors
    gl.getError();

    var tex = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, tex );
    gl.texImage2D(  gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null );
    gl.deleteTexture( tex );

    return ( gl.getError() === 0 );

  },


  _testRenderable : function( format, type, internal ){
    var gl = this.gl;


    var tex = gl.createTexture();

    gl.bindTexture( gl.TEXTURE_2D, tex );
    gl.texImage2D(  gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null );


    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer( gl.FRAMEBUFFER, fbo );
    gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0 );

    var ok = ( gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture( gl.TEXTURE_2D, null );

    gl.deleteTexture( tex );
    gl.deleteFramebuffer( fbo );

    return ok;

  }


};





function FMT( format, internal, type ){
  return {
    format   : format  ,
    internal : internal,
    type     : type
  };
}


// use xor as hash complete format
// should be good enought ...
function _hashPF( format, type, internal ){
  return format ^ (internal << 8) ^ (type << 16);
}





module.exports = PixelFormats;