// *******************************************************
// CS 174a Graphics Example Code
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.  

// Now go down to display() to see where the sample shapes are drawn, and to see where to fill in your own code.

"use strict"
var canvas, canvas_size, gl = null, g_addrs,
	movement = vec2(),	thrust = vec3(), 	looking = false, prev_time = 0, animate = false, animation_time = 0;
		var gouraud = false, color_normals = false, solid = false, rotating = false;

		

function make_snow()		
{
	var result = {};
	result.model_transform = mat4();							
	
	for( var j = 0; j < 3; j++ )
		result.model_transform[j][3] = 250 * (Math.random() - .5);	

	result.model_transform[1][3] = 55 + 10 * Math.random();	
	
	result.model_transform = mult( rotate( 360 * Math.random(), Math.random(), Math.random(), Math.random() ), result.model_transform  );	

	result.scale = vec3( .2, .2, .2 );	
	
	result.linear_velocity = vec3();
	result.linear_velocity[1] = -.0000001;

	
	result.linear_velocity = scale_vec( .03/length( result.linear_velocity ), result.linear_velocity );
				
	result.angular_velocity = Math.random();	
			
	result.spin_axis = vec3();
	for( var j = 0; j < 3; j++ )
			result.spin_axis[j] = Math.random();
				
	return result;
}		

function make_cloud()
{
	var result = {};
	result.model_transform = mat4();							
	
	for( var j = 0; j < 3; j++ )
		result.model_transform[j][3] = 250 * (Math.random() - .5);	

	result.model_transform[1][3] = 60 + 5 * Math.random();	

	result.scale = vec3( 30 + 15 * Math.random(), 5 + 2 * Math.random(), 30 + 15 * Math.random() );	
	return result;
}

function make_tree()
{
	var result = {};
	result.model_transform = mat4();							
	
	for( var j = 0; j < 3; j++ ) {		
		result.model_transform[j][3] = 250 * (Math.random() - .5);		
		while (Math.abs(result.model_transform[0][3]) <= 7 ) {
			result.model_transform[0][3] = 225 * (Math.random() - .5);	
		}
	}

	result.model_transform[1][3] = 0;	
	
	result.scale = vec3( 3 + 1.5 * Math.random(), 3 + 1.5 * Math.random(), 10 + 5 * Math.random() );

	result.height1 = Math.floor(5 + 5 * Math.random());
	return result;
}
		
		
// *******************************************************	
// When the web page's window loads it creates an Animation object, which registers itself as a displayable object to our other class GL_Context -- which OpenGL is told to call upon every time a
// draw / keyboard / mouse event happens.

window.onload = function init() {	var anim = new Animation();	}
function Animation()
{
	( function init (self) 
	{
		self.context = new GL_Context( "gl-canvas" );
		self.context.register_display_object( self );
		
		gl.clearColor( 0, 0, 0, 1 );			// Background color

		self.m_cube = new cube();
		self.m_obj = new shape_from_file( "teapot.obj" )
		self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 4 );	
		self.m_fan = new triangle_fan_full( 10, mat4() );
		self.m_strip = new rectangular_strip( 1, mat4() );
		self.m_cylinder = new cylindrical_strip( 10, mat4() );
		//self.m_cone = new cone();
		self.m_cap_cylinder = new capped_cylinder();

		self.animation_delta_time = 0;

		self.camera_transform = translate(0, 0,-40);
		self.projection_transform = perspective(45, canvas.width/canvas.height, .1, 1000);		// The matrix that determines how depth is treated.  It projects 3D points onto a plane.
		
		gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);		gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);		gl.uniform1i( g_addrs.SOLID_loc, solid);
		
		self.num_bodies = 150;
		self.bodies = [];		
		for( var i = 0; i < self.num_bodies; i++ )			// Generate snow
			self.bodies[i] = make_snow();
		
		self.num_clouds = 20;
		self.clouds = [];
		for( var i = 0; i < self.num_clouds; i++ )			// Generate clouds
			self.clouds[i] = make_cloud();
		
		self.num_trees = 30;
		self.trees = [];
		for( var i = 0; i < self.num_trees; i++ )			// Generate trees
			self.trees[i] = make_tree();
			
		self.animation_time = 0
		self.context.render();	
	} ) ( this );	
	
	canvas.addEventListener('mousemove', function(e)	{		e = e || window.event;		movement = vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2, 0);	});
}


// *******************************************************	
// init_keys():  Define any extra keyboard shortcuts here
Animation.prototype.init_keys = function()
{
	shortcut.add( "Space", function() { thrust[1] = -1; } );			shortcut.add( "Space", function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "z",     function() { thrust[1] =  1; } );			shortcut.add( "z",     function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "w",     function() { thrust[2] =  1; } );			shortcut.add( "w",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "a",     function() { thrust[0] =  1; } );			shortcut.add( "a",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "s",     function() { thrust[2] = -1; } );			shortcut.add( "s",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "d",     function() { thrust[0] = -1; } );			shortcut.add( "d",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "f",     function() { looking = !looking; } );
	shortcut.add( ",",     ( function(self) { return function() { self.camera_transform = mult( rotate( 3, 0, 0,  1 ), self.camera_transform ); }; } ) (this) ) ;
	shortcut.add( ".",     ( function(self) { return function() { self.camera_transform = mult( rotate( 3, 0, 0, -1 ), self.camera_transform ); }; } ) (this) ) ;

	shortcut.add( "r",     ( function(self) { return function() { self.camera_transform = mat4(); }; } ) (this) );
	shortcut.add( "ALT+s", function() { solid = !solid;					gl.uniform1i( g_addrs.SOLID_loc, solid);	
																		gl.uniform4fv( g_addrs.SOLID_COLOR_loc, vec4(Math.random(), Math.random(), Math.random(), 1) );	 } );
	shortcut.add( "ALT+g", function() { gouraud = !gouraud;				gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);	} );
	shortcut.add( "ALT+n", function() { color_normals = !color_normals;	gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);	} );
	shortcut.add( "ALT+a", function() { animate = !animate; } );
	shortcut.add( "ALT+r", function() { rotating = !rotating });
	shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
	shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );	
}

function update_camera( self, animation_delta_time )
	{
		var leeway = 70, border = 50;
		var degrees_per_frame = .0005 * animation_delta_time;
		var meters_per_frame  = .03 * animation_delta_time;
																					// Determine camera rotation movement first
		var movement_plus  = [ movement[0] + leeway, movement[1] + leeway ];		// movement[] is mouse position relative to canvas center; leeway is a tolerance from the center.
		var movement_minus = [ movement[0] - leeway, movement[1] - leeway ];
		var outside_border = false;
		
		for( var i = 0; i < 2; i++ )
			if ( Math.abs( movement[i] ) > canvas_size[i]/2 - border )	outside_border = true;		// Stop steering if we're on the outer edge of the canvas.

		for( var i = 0; looking && outside_border == false && i < 2; i++ )			// Steer according to "movement" vector, but don't start increasing until outside a leeway window from the center.
		{
			var velocity = ( ( movement_minus[i] > 0 && movement_minus[i] ) || ( movement_plus[i] < 0 && movement_plus[i] ) ) * degrees_per_frame;	// Use movement's quantity unless the &&'s zero it out
			self.camera_transform = mult( rotate( velocity, i, 1-i, 0 ), self.camera_transform );			// On X step, rotate around Y axis, and vice versa.
		}
		self.camera_transform = mult( translate( scale_vec( meters_per_frame, thrust ) ), self.camera_transform );		// Now translation movement of camera, applied in local camera coordinate frame
	}

function Stack()
{
 this.stac=new Array();
 this.pop=function(){
  return this.stac.pop();
 }
 this.push=function(item){
  this.stac.push(item);
 }
}

Animation.prototype.drawPlane = function(model_transform) {
	model_transform = mult ( model_transform, translate(0,-15,0));
	model_transform = mult ( model_transform, scale(250,10,250));
	//model_transform = mult ( model_transform, rotate(this.animation_time/200,0,1,0));
	this.m_cube.draw( model_transform, this.camera_transform, this.projection_transform, "snow.png");	
}


Animation.prototype.drawTree = function(model_transform, width , height, divisions) {
	if (divisions > 0) {
		var stack = new Stack();
		stack.push(model_transform);
		model_transform = mult( model_transform, translate(0,-.4 * height, 0) );
		model_transform = mult( model_transform, scale(width, 2*height, width));
		this.m_cap_cylinder.draw( model_transform, this.camera_transform, this.projection_transform, "bark.png");
		model_transform = stack.pop();
		stack.push(model_transform);
		model_transform = mult( model_transform, translate(0,4,0));
		model_transform = mult( model_transform, rotate(80, 1, 0, 0));
		this.drawTree(model_transform,width/1.5, height / 1.7, divisions - 1);
		model_transform = stack.pop();
		model_transform = mult( model_transform, rotate(120, 0, 1, 0));
		stack.push(model_transform);
		model_transform = mult( model_transform, translate(0,4,0));
		model_transform = mult( model_transform, rotate(80, 1, 0, 0));
		this.drawTree(model_transform,width/1.5, height / 1.7, divisions - 1);
		model_transform = stack.pop();
		model_transform = mult( model_transform, rotate(120, 0, 1, 0));
		stack.push(model_transform);
		model_transform = mult( model_transform, translate(0,4,0));
		model_transform = mult( model_transform, rotate(80, 1, 0, 0));
		this.drawTree(model_transform,width/1.5, height / 1.7, divisions - 1);
		model_transform = stack.pop();
	}
}

Animation.prototype.drawBackground = function(model_transform) {
	var stack = new Stack();
	stack.push(model_transform);
	model_transform = mult(model_transform, translate(0,40,-125))
	model_transform = mult(model_transform, scale(250,125,0));
	this.m_cube.draw(model_transform, this.camera_transform, this.projection_transform, "mountain.png");
	model_transform = stack.pop();
	stack.push(model_transform);
	model_transform = mult(model_transform, translate(0,40,125))
	model_transform = mult(model_transform, scale(250,125,0));
	this.m_cube.draw(model_transform, this.camera_transform, this.projection_transform, "mountain.png");
	model_transform = stack.pop();
	stack.push(model_transform);
	model_transform = mult(model_transform, rotate(-90,1,0,0));
	model_transform = mult(model_transform, translate(125,0,40))
	model_transform = mult(model_transform, scale(0,250,125));
	this.m_cube.draw(model_transform, this.camera_transform, this.projection_transform, "mountain.png");
	model_transform = stack.pop();
	stack.push(model_transform);
	model_transform = mult(model_transform, rotate(-90,1,0,0));
	model_transform = mult(model_transform, translate(-125,0,40))
	model_transform = mult(model_transform, scale(0,250,125));
	this.m_cube.draw(model_transform, this.camera_transform, this.projection_transform, "mountain.png");
	//cloud backdrop
	model_transform = stack.pop();
	stack.push(model_transform);
	model_transform = mult ( model_transform, translate(0,63,0));
	model_transform = mult ( model_transform, scale(250,0,250));
	this.m_cube.draw(model_transform, this.camera_transform, this.projection_transform, "cloud.png");
	model_transform = stack.pop();

}


Animation.prototype.drawBee = function(model_transform,distance) {
	model_transform = mult ( model_transform, rotate(this.animation_time/400,0,1,0));
	model_transform = mult ( model_transform, translate((10 + distance * 1.5) * Math.cos((this.animation_time/200) + 2 * distance),(10 + distance * 1.5) * Math.sin((this.animation_time/200) - distance * 4),0));
	this.m_sphere.draw( model_transform, this.camera_transform, this.projection_transform, "stars.png");	
}

Animation.prototype.drawFlower = function(model_transform) {
	var stack = new Stack();
	stack.push(model_transform);
	model_transform = mult ( model_transform, translate(0,-2,0));
	model_transform = mult ( model_transform, scale(3,1.5,3));
	//model_transform = mult ( model_transform, rotate(this.animation_time/200,0,1,0));
	this.m_sphere.draw( model_transform, this.camera_transform, this.projection_transform, "stars.png");
	model_transform = stack.pop();
	stack.push(model_transform);
	gl.uniform4fv( g_addrs.color_loc, vec4( .3,.8,.4,1 ) );
	model_transform = mult(model_transform, translate(0,-11,0));
	model_transform = mult(model_transform, scale(.9,9,.9));
	this.m_cap_cylinder.draw(model_transform,this.camera_transform,this.projection_transform);
	model_transform = stack.pop();	
	for (var i = 0; i < 8; i++) {
		model_transform = mult(model_transform, rotate(45,0,1,0));
		stack.push(model_transform);
		model_transform = mult(model_transform, translate(3.5,-1.5,0));
		model_transform = mult(model_transform, scale(2,.5,1));
		model_transform = mult(model_transform, rotate(40 * Math.sin(this.animation_time),0,0,1));
		this.m_sphere.draw(model_transform,this.camera_transform,this.projection_transform);
		model_transform = stack.pop();	
	}
	gl.uniform4fv( g_addrs.color_loc, vec4( 1,1,1,1 ) );
}

Animation.prototype.drawBaym = function(model_transform) {
	gl.uniform4fv( g_addrs.color_loc, vec4( .9,.9,.9,1 ) );
	var stack = new Stack();
	model_transform = mult(model_transform, translate(0,-3.5,0));
	stack.push(model_transform);
	//body
	model_transform = mult(model_transform, scale(3,5,2));
	this.m_sphere.draw(model_transform,this.camera_transform,this.projection_transform);
	model_transform = stack.pop();
	//legs
	stack.push(model_transform);
	//model_transform = mult(model_transform, rotate(4,0,0,1));
	if (this.animation_time <= 9000) {
		model_transform = mult(model_transform, rotate(10 * Math.sin(this.animation_time/100),1,0,0));
	}
	model_transform = mult(model_transform, translate(1.5,-5,0));
	model_transform = mult(model_transform, scale(1,1.5,1));
	this.m_sphere.draw(model_transform,this.camera_transform,this.projection_transform);
	model_transform = stack.pop();
	stack.push(model_transform);
	//model_transform = mult(model_transform, rotate(-4,0,0,1));
	if (this.animation_time <= 9000) {
		model_transform = mult(model_transform, rotate(-10 * Math.sin(this.animation_time/100),1,0,0));
	}
	model_transform = mult(model_transform, translate(-1.5,-5,0));
	model_transform = mult(model_transform, scale(1,1.5,1));
	this.m_sphere.draw(model_transform,this.camera_transform,this.projection_transform);
	model_transform = stack.pop();
	//arms
	stack.push(model_transform);
	model_transform = mult(model_transform, rotate(12,0,0,1));
	model_transform = mult(model_transform, translate(3,-.5,0));
	model_transform = mult(model_transform, scale(1,3.5,1));
	this.m_sphere.draw(model_transform,this.camera_transform,this.projection_transform);
	model_transform = stack.pop();
	stack.push(model_transform);
	model_transform = mult(model_transform, rotate(-12,0,0,1));
	model_transform = mult(model_transform, translate(-3,-.5,0));
	model_transform = mult(model_transform, scale(1,3.5,1));
	this.m_sphere.draw(model_transform,this.camera_transform,this.projection_transform);
	model_transform = stack.pop();
	if (this.animation_time > 9000) {
		//model_transform
		model_transform = mult(model_transform, rotate(Math.min((this.animation_time - 9000)/100, 30), 1,0,0));
	}
	//head
	stack.push(model_transform);
	model_transform = mult(model_transform, translate(0,5.2,0));
	stack.push(model_transform);
	model_transform = mult(model_transform, scale(1.5,1,1));
	this.m_sphere.draw(model_transform,this.camera_transform,this.projection_transform);
	//eyes
	model_transform = stack.pop();
	stack.push(model_transform);
	gl.uniform4fv( g_addrs.color_loc, vec4( .1,.1,.1,1 ) );
	model_transform = mult(model_transform, translate(-.6,.1,.9));
	model_transform = mult(model_transform, scale(.17,.17,.1));
	this.m_sphere.draw(model_transform,this.camera_transform,this.projection_transform);
	model_transform = stack.pop();
	stack.push(model_transform);
	model_transform = mult(model_transform, translate(.6,.1,.9));
	model_transform = mult(model_transform, scale(.17,.17,.1));
	this.m_sphere.draw(model_transform,this.camera_transform,this.projection_transform);
	model_transform = stack.pop();
	model_transform = mult(model_transform, translate(0,.1,.9));
	model_transform = mult(model_transform, scale(.9,.05,.2));
	this.m_cube.draw(model_transform, this.camera_transform, this.projection_transform);

	gl.uniform4fv( g_addrs.color_loc, vec4( .9,.9,.9,1 ) );
}


// *******************************************************	
// display(): called once per frame, whenever OpenGL decides it's time to redraw.


Animation.prototype.display = function(time)
	{
		if(!time) { time = 0;}
		this.animation_delta_time = time - prev_time;
		if(animate) this.animation_time += this.animation_delta_time;
		prev_time = time;
		
		update_camera( this, this.animation_delta_time );

		var basis_id = 0;
		
		var model_transform = mat4();
		
		/**********************************
		Start coding here!!!!
		**********************************/

		var stack = new Stack();
		stack.push(model_transform);
		this.drawPlane(model_transform);
		this.drawBackground(model_transform);
		model_transform = mult(model_transform, translate(0,-8,0));
		model_transform = mult(model_transform, scale(.1,.1,.1));
		
		if (this.animation_time >= 9000) {
			model_transform = mult(model_transform, translate(0,(-this.animation_time + 9000)/200,0));
		}
		stack.push(model_transform);
		for (var i = 1; i <= 7; i++) {
			model_transform = mult (model_transform, rotate((- 2* i - 6) * (-3 * i - 6),0,1,0));
			this.drawBee(model_transform, i);
		}
		model_transform = stack.pop();
		model_transform = mult(model_transform, scale(1.5,1.5,1.5));
		this.drawFlower(model_transform);
		model_transform = stack.pop();
		stack.push(model_transform);
		if (this.animation_time < 9000)
		{
			model_transform = mult(model_transform, translate(0,0,-100 + this.animation_time/100));
		}
		else {
			model_transform = mult(model_transform, translate(0,0,-10));
		}
		this.drawBaym(model_transform);
		
		model_transform = stack.pop();
		for (var i = 0; i < this.num_trees; i++) {
			this.drawTree(this.trees[i].model_transform,1,this.trees[i].height1, 3);
		}
		
		for (var i = 0; i < this.num_clouds; i++) {
			this.m_sphere.draw( mult( this.clouds[i].model_transform, scale(this.clouds[i].scale) ), this.camera_transform, this.projection_transform, "cloud.png" );	
		}
		//gl.uniform4fv( g_addrs.color_loc, 			vec4( .5,.5,.5,1 ) );	// Color: Gray
		for( var i = 0; i < this.num_bodies; i++ )
		{
			this.m_sphere.draw( mult( this.bodies[i].model_transform, scale(this.bodies[i].scale) ), this.camera_transform, this.projection_transform, "snow.png" );			
			
			this.bodies[i].linear_velocity[1] -= .00000001;												// Gravity updates translation velocity.
			var delta = translate( scale_vec( this.animation_delta_time, this.bodies[i].linear_velocity ) );		// Make proportional to real time.
			this.bodies[i].model_transform = mult( delta, this.bodies[i].model_transform );					// Apply translation velocity - premultiply to keep together
			
			delta = rotate( this.animation_delta_time * this.bodies[i].angular_velocity, this.bodies[i].spin_axis );		// Apply angular velocity - postmultiply to keep together
			this.bodies[i].model_transform = mult( this.bodies[i].model_transform, delta );
		
			if( this.bodies[i].model_transform[1][3] < -10 && this.bodies[i].linear_velocity[1] < 0 )	// If we pass below the ground and are still falling,
				this.bodies[i] = make_snow();			// Reverse our Y velocity.			
		}
		if (rotating) {
			this.camera_transform = lookAt(vec3(Math.sin(time * .0001) * 100, 20, Math.cos(time * .0001) * 100), vec3(0,0,0), vec3(0,1,0) ); 
		}
	}	



Animation.prototype.update_strings = function( debug_screen_object )		// Strings this particular class contributes to the UI
{
	debug_screen_object.string_map["time"] = "Time: " + this.animation_time/1000 + "s";
	debug_screen_object.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
	debug_screen_object.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	debug_screen_object.string_map["thrust"] = "Thrust: " + thrust;
	//debug_screen_object.string_map["frame"] = "Frames per Second: " + this.animation_delta_time * 1000;
}