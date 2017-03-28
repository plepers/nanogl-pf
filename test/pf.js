var PF         = require( '../index' );

var expect  = require( 'expect.js' );

var testContext = require( './utils/TestContext' );
var gl = testContext.getContext();


describe( "pf", function(){

  describe( "dispose", function(){
  

    it( "dispose", function(){
      PF(gl).dispose();
    });


  });


  describe( "isAvailable", function(){
  

    it( "RGB/UNSIGNED_BYTE always true ?", function(){

      var v = PF(gl).isAvailable( gl.RGB, gl.UNSIGNED_BYTE )

      expect( v ).to.be.ok()

    });


    it( "unknown format return false", function(){

      var v = PF(gl).isAvailable( 0x1010, 0x9090 )

      expect( v ).to.not.be.ok()

    });


  });


  describe( "isWritable", function(){
  

    it( "RGB/UNSIGNED_BYTE always true ?", function(){

      var v = PF(gl).isWritable( gl.RGB, gl.UNSIGNED_BYTE )

      expect( v ).to.be.ok()

    });

    
    it( "unknown format return false", function(){

      var v = PF(gl).isWritable( 0x1010, 0x9090 )

      expect( v ).to.not.be.ok()

    });


  });


});