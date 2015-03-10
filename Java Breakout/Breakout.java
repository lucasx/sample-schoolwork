/*
 * File: Breakout.java
 * -------------------
 * Name: Lucas Sanchez
 * Date: October 2013
 * 
 * This file implements the game of Breakout.
 */

/*
 * This is my implementation of the third assignment
 * of CS106A, which I took fall quarter of my freshman
 * year at Stanford.
 */

import acm.graphics.*;
import acm.program.*;
import acm.util.*;

import java.applet.*;
import java.awt.*;
import java.awt.event.*;

public class Breakout extends GraphicsProgram {

/** Width and height of application window in pixels.  On some platforms 
  * these may NOT actually be the dimensions of the graphics canvas. */
	public static final int APPLICATION_WIDTH = 400;
	public static final int APPLICATION_HEIGHT = 620;

/** Dimensions of game board.  On some platforms these may NOT actually
  * be the dimensions of the graphics canvas. */
	private static final int WIDTH = APPLICATION_WIDTH;
	private static final int HEIGHT = APPLICATION_HEIGHT - 20;

/** Dimensions of the paddle */
	private static final int PADDLE_WIDTH = 60;
	private static final int PADDLE_HEIGHT = 10;

/** Offset of the paddle up from the bottom */
	private static final int PADDLE_Y_OFFSET = 30;
	
/** Y coordinate of the paddle */
	private static final int PADDLE_Y = HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT;

/** Number of bricks per row */
	private static final int NBRICKS_PER_ROW = 10;

/** Number of rows of bricks */
	private static final int NBRICK_ROWS = 10;

/** Separation between bricks */
	private static final int BRICK_SEP = 4;

/** Width of a brick */
	private static final int BRICK_WIDTH =
		(WIDTH - (NBRICKS_PER_ROW - 1) * BRICK_SEP) / NBRICKS_PER_ROW;

/** Height of a brick */
	private static final int BRICK_HEIGHT = 8;

/** Radius of the ball in pixels */
	private static final int BALL_RADIUS = 10;

/** Offset of the top brick row from the top */
	private static final int BRICK_Y_OFFSET = 70;

/** Number of turns */
	private static final int NTURNS = 3;

/* Method: run() */
/** Runs the Breakout program. */
	public void run() {
		setup();
		
		play();
		
		conclude();
	}
	
	/* Places all the objects in their starting
	 * positions in the Breakout world.
	 */
	private void setup()	{
		addBricks();
		addPaddle();
		addBall();
	}
	
	/* Creates and places all the bricks in their
	 * starting positions.
	 */
	private void addBricks()	{
		int blockWidth = BRICK_WIDTH*NBRICKS_PER_ROW + (NBRICKS_PER_ROW-1)*BRICK_SEP;	//The width of the whole section of bricks
		int x0 = (WIDTH - blockWidth) / 2;	//X coordinate for first column of bricks
		
		for(int i=0; i<NBRICK_ROWS; i++)	{
			int y = BRICK_Y_OFFSET + i*(BRICK_HEIGHT + BRICK_SEP);
			
			for(int j=0; j<NBRICKS_PER_ROW; j++)	{
				int x = x0 + j*(BRICK_WIDTH + BRICK_SEP);
				
				GRect brick = new GRect(x, y, BRICK_WIDTH, BRICK_HEIGHT);
				
				brick.setFilled(true);
				switch(i/2)	{
				case 0: brick.setColor(Color.red);
						brick.setFillColor(Color.red);
						break;
				case 1: brick.setColor(Color.orange);
						brick.setFillColor(Color.orange);
						break;
				case 2: brick.setColor(Color.yellow);
						brick.setFillColor(Color.yellow);
						break;
				case 3: brick.setColor(Color.green);
						brick.setFillColor(Color.green);
						break;
				case 4: brick.setColor(Color.cyan);
						brick.setFillColor(Color.cyan);
						break;
				}
				
				add(brick);
			}
		}
	}
	
	/* 
	 * Sets up the paddle and adds it to the screen.
	 */
	private void addPaddle()	{
		int x = WIDTH/2 - PADDLE_WIDTH/2;
		paddle = new GRect(x, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT);
		paddle.setFilled(true);
		
		add(paddle);
		addMouseListeners();
	}
	
	/* Links the paddle's movement to the
	 * mouse's movement.
	 */
	public void mouseMoved(MouseEvent e)	{
		int x = e.getX();
		
		if(x < WIDTH - PADDLE_WIDTH)	{
			paddle.setLocation(x, PADDLE_Y);
		}
	}
	
	/* Sets up the ball and adds it to the screen.
	 */
	private void addBall()	{
		int x = WIDTH/2 - BALL_RADIUS;
		int y = HEIGHT/2 - BALL_RADIUS;
		vx = rgen.nextDouble(1.0, 3.0);
		if(rgen.nextBoolean(.5))	vx = -vx;
		vy = 3.0;
		
		ball = new GOval(x, y, 2*BALL_RADIUS, 2*BALL_RADIUS);
		ball.setFilled(true);
		
		add(ball);
	}

	/* Keeps track of the ball
	 * and of progress in the game. 
	 */
	private void play()	{
		while(turnsLeft > 0 && bricksLeft > 0)	{
			reactToWalls();
			
			reactToObjects();
			
			ball.move(vx,vy);
			pause(15);
		}
		
		remove(ball);
	}
	
	/* Checks to see if the ball has
	 * gone out of bounds. If it has,
	 * changes the direction to keep
	 * it inside the walls.
	 */
	private void reactToWalls()	{
		double y = ball.getY();
		double x = ball.getX();
		if(y + 2*BALL_RADIUS > HEIGHT)	{
			turnsLeft -= 1;
			remove(ball);
			addBall();
		}	else if(y < 0)	{
			vy = -vy;
		}	else if(x + 2*BALL_RADIUS > WIDTH || x < 0)	{
			vx = -vx;
		}
	}
	
	/* Checks to see if the ball has
	 * collided with any other objects
	 * in the world. If it has, changes
	 * the direction of the ball accordingly.
	 * If the collision was with a
	 * brick, removes the brick.
	 */
	private void reactToObjects()	{
		GObject collider = getCollidingObject();
		if(collider != null)	{
			if(collider != paddle)	{
				remove(collider);
				bricksLeft -= 1;
			}
			vy = -vy;
		}
	}
	
	/* Checks the corners around the
	 * ball for objects, returns the
	 * object at the first corner
	 * at which it encounters an
	 * object, starting from the upper
	 * right and going clockwise.
	 */
	private GObject getCollidingObject()	{
		double x = ball.getX();
		double y = ball.getY();
		int r = BALL_RADIUS;
		
		GObject collider = getElementAt(x,y);
		if(collider == null)	{
			collider = getElementAt(x + 2*r, y);
		}
		if(collider == null)	{
			collider = getElementAt(x + 2*r, y + 2*r);
		}
		if(collider == null)	{
			collider = getElementAt(x, y + 2*r);
		}
		
		return collider;
	}
	
	/* Removes the ball and displays
	 * the outcome of the game once
	 * the game is over.
	 */
	private void conclude()	{
		GLabel conclusion;
		if(bricksLeft < 1)	{
			conclusion = new GLabel("Congratulations! You win!");
		}	else	{	//Should I do an "else if(turnsLeft < 1)" on this line instead? Or is this better?
			conclusion = new GLabel("Game over! You lose.");
		}
		
		add(conclusion, WIDTH/2 - conclusion.getWidth()/2, HEIGHT/2 - conclusion.getAscent()/2);
	}
	
	private GRect paddle;
	private GOval ball;
	
	private RandomGenerator rgen = RandomGenerator.getInstance();
	private double vx,vy;
	
	private int turnsLeft = NTURNS;
	private int bricksLeft = NBRICKS_PER_ROW * NBRICK_ROWS;
}
