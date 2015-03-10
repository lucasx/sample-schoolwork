# One of the projects I am finishing up as part of my work
# at the Stanford Virtual Human Interaction Lab.

# Leland study 2015!!!
#
# February 2015
# This version by Lucas Sanchez
#
# Instructions
# 1. Launch the world
# 2. Start the study by pressing 1
# -  Press r at any time to reset the participant's orientation.

# Keyboard controls
# 1 - play narrative from beginning
# r - reset view
# p - play narrative from right before Leland enters the world. Press this instead of pressing 1.
#
## Debugging controls:
# 2 - move Leland toward you
# 3 - move Leland away from you
# 4 - increase fog
# 5 - decrease fog
# 6 - toggle Leland's ghost-like effect

# Functionality still need to add:
# -Idle animation on Leland
# -Oculus camera support for tracking participant movement
# -Effects to make him more ghost-like, probably by editing the model


import viz
import vizact
import viztask
import vizconnect
import vizinput
import vizmat

## Constants ##
# Mode - If debugging is enabled, certain aspects about the world can be changed while running the script.
DEBUG_MODE = True

# Hardware constants
RIFT = False
PPT1 = False # Not yet tested in PPT1, but should work

# Environment constants
CURRENT_FOG = 0.05

# Study constants
COND1 = 'Normal, opaque Leland'
COND2 = 'Ghost-like Leland'
COND3 = 'No Leland'
CONDITION_DESCRIPTIONS = [COND1, COND2, COND3]
NORMAL_LELAND_CONDITION = 0
GHOST_LELAND_CONDITION = 1
NO_LELAND_CONDITION = 2

# Leland avatar constants
LELAND_DEFAULT_ALPHA = 1
LELAND_GHOST_ALPHA = .45
LELAND_START_POS = [0,0,7]
LELAND_FINAL_POS = [0,0,5]
NOD_TIME = 1

def setupHardware():
	global hmd_sensor
	if RIFT:
		viz.go(viz.FULLSCREEN)

		import oculus
		hmd = oculus.Rift()
		hmd_sensor = hmd.getSensor()
		hmd_sensor.reset()
		if PPT1:
			PPT_HOSTNAME = '171.64.33.43'
			vrpn = viz.add('vrpn7.dle')
			headTracker = vrpn.addTracker('PPT0@' + PPT_HOSTNAME, 0)
			headPPT = viz.mergeLinkable(headTracker,hmd_sensor)
			hmd_link = viz.link(headPPT, viz.MainView)
			
		else:
			hmd_link = viz.link(hmd_sensor, viz.MainView, mask=viz.LINK_ORI)
	else:
		viz.go()

def setupForest():
	global forest
	forest = viz.addChild('assets/models/forest2_rockInsteadOfCave.osgb')
	forest.disable(viz.BLEND)
	forest.enable(viz.SAMPLE_ALPHA_TO_COVERAGE)
	forest.setEuler([-90,0,0])
	forest.setPosition([0,0,3])

def setFog():
	#Add base fog	
	#Make color of fog grey
	viz.fogcolor([.5] * 3)
	viz.clearcolor(0.5,0.5,0.5)
	viz.fog(CURRENT_FOG)

def setupSound():
	global narrativeSound
	soundNode = viz.addGroup(pos=[0,1.8,1])
	narrativeSound = soundNode.playsound('assets/sounds/leland_narrative_edited.wav')
	narrativeSound.pause()
	narrativeSound.volume(1.5)

	if PPT1:
		import vizsonic
		forestAmbient = vizsonic.setAmbient('assets/sounds/forestambient.wav', 0.25, 0.1)
	else:
		forestAmbient = viz.addAudio('assets/sounds/forestambient.wav')
		forestAmbient.loop(viz.ON)
		forestAmbient.volume(.25)
		forestAmbient.play()

def setupEnvironment():
	setupForest()
	setFog()
	setupSound()

def askWhichCondition():
	return vizinput.choose('Which condition?', CONDITION_DESCRIPTIONS)

#Add Leland character to the world
def setupLeland(condition):
	global leland_avatar
	global leland_head
	global leland_ghost
	global clothes
	
	leland_avatar = viz.addAvatar('assets/avatars/leland/leland_body.cfg')
	leland_head = viz.addFace( 'assets/avatars/leland/leland_head2.vzf') 
	leland_avatar.setFace(leland_head, 'Bip01 Head', 'Bip01 Neck' )
	clothes = viz.addTexture("assets/avatars/leland/child01_m.tga")
	
	leland_avatar.state(0)
	
	if condition == NORMAL_LELAND_CONDITION:
		leland_ghost = False
		leland_avatar.texture(clothes)
	elif condition == GHOST_LELAND_CONDITION:
		leland_ghost = True
		leland_avatar.texture(None)
		
	leland_avatar.getBone('Bip01 L UpperArm').lock(recurse=1)#To prevent Vizard glitch where he starts waving after he performs any other action

	#Set Leland in the world
	leland_avatar.setEuler([180, 0, 0])
	leland_avatar.setPosition(LELAND_START_POS)
	leland_avatar.setScale(.012, .012,.012)
	
	leland_avatar.alpha(0)
	leland_head.alpha(0)
	
	leland_avatar.drawOrder(10, bin=viz.BIN_TRANSPARENT)
	leland_head.drawOrder(10, bin=viz.BIN_TRANSPARENT)

def setScene():
	global condition
	setupEnvironment()
	if condition is not NO_LELAND_CONDITION:
		setupLeland(condition)

## Main ##
condition = askWhichCondition()

viz.setMultiSample(4)
setupHardware()

setScene()

started = False
randomNoddingEnabled = False

## Keyboard controls section ##

def increaseFog():
	global CURRENT_FOG
	currFog = CURRENT_FOG
	fogNew = currFog + 0.05
	viz.fog(fogNew)
	CURRENT_FOG = fogNew

def decreaseFog():
	global CURRENT_FOG
	currFog = CURRENT_FOG
	fogNew = currFog - 0.05
	viz.fog(fogNew)
	CURRENT_FOG = fogNew

def moveLelandPlusZ():
	currPos = leland_avatar.getPosition()
	currPosZ = currPos[2]
	newPosZ = currPosZ + 0.1
	leland_avatar.setPosition([currPos[0],currPos[1],newPosZ])

def moveLelandNegZ():
	currPos = leland_avatar.getPosition()
	currPosZ = currPos[2]
	newPosZ = currPosZ - 0.1
	leland_avatar.setPosition([currPos[0],currPos[1],newPosZ])
	
def ghostToggle():
	global leland_ghost
	if leland_ghost:
		# turn back to normal
		leland_avatar.texture(clothes)
		leland_avatar.alpha(LELAND_DEFAULT_ALPHA)
		leland_head.alpha(LELAND_DEFAULT_ALPHA)
		leland_ghost = False
	else:
		# turn into ghost
		leland_avatar.texture(None)
		leland_avatar.alpha(LELAND_GHOST_ALPHA)
		leland_head.alpha(LELAND_GHOST_ALPHA)
		leland_ghost = True

def reset():
	if RIFT:
		hmd_sensor.reset()
	else:
		viz.MainView.setPosition([0,1.82,0])
		viz.MainView.setEuler([0,0,0])

def playNarrative():
	state = narrativeSound.getState()
	if viz.MEDIA_PAUSED:
		narrativeSound.play()
		print 'playing'
	else:
		narrativeSound.pause()
		print 'paused'

def enterLeland():
	if condition == NORMAL_LELAND_CONDITION:
		fadeInBody = fadeInHead = vizact.fadeTo(LELAND_DEFAULT_ALPHA, time=4)
	elif condition == GHOST_LELAND_CONDITION:
		fadeInHead = vizact.fadeTo(LELAND_GHOST_ALPHA, time=4)
		fadeInBody = vizact.fadeTo(LELAND_GHOST_ALPHA*.6, time=4)
	
	driftIn = vizact.moveTo(LELAND_FINAL_POS, time=6, interpolate=vizact.easeOutQuintic)
	
	enterHead = vizact.parallel(fadeInHead, driftIn)
	enterBody = vizact.parallel(fadeInBody, driftIn)
	
	leland_head.addAction(enterHead)
	leland_avatar.addAction(enterBody)

def nod():
	dipAngle = vizmat.GetRandom(5,9)
	percentTimeDown = vizmat.GetRandom(.35,.6)
	percentTimeUp = NOD_TIME - percentTimeDown
	
	nod_down = vizact.boneSpinTo('Bip01 Head', mode=viz.AVATAR_LOCAL, euler=[0,dipAngle,0], time=percentTimeDown*NOD_TIME, interpolate=vizact.cubic)
	nod_up = vizact.boneSpinTo('Bip01 Head', mode=viz.AVATAR_LOCAL, euler=[0,0,0], time=percentTimeUp*NOD_TIME, interpolate=vizact.cubic)
	
	yield viztask.addAction(leland_avatar, nod_down)
	yield viztask.addAction(leland_avatar, nod_up)

def leland_nod():
	viztask.schedule(nod())

def doubleNod():
	yield nod()
	yield nod()

def leland_doubleNod():
	viztask.schedule(doubleNod())

def randomNodding():
	global randomNoddingEnabled
	while randomNoddingEnabled:
		pause = vizmat.GetRandom(NOD_TIME, NOD_TIME + 8)
		#print "Time until next nod: " + str(pause)
		yield viztask.waitTime(pause)
		
		if vizmat.GetRandom(0,1) < .5: # Half a chance to have two nods in a row
			leland_nod()
		else:
			leland_doubleNod()
			yield viztask.waitTime(NOD_TIME)
	
def enableRandomNodding():
	global randomNoddingEnabled
	if randomNoddingEnabled == True: return
	randomNoddingEnabled = True
	viztask.schedule(randomNodding())

def disableRandomNodding():
	global randomNoddingEnabled
	randomNoddingEnabled = False

WAVE_LAG = 2.3
# 2.3 seconds pass between calling this function and Leland waving.
# This is because Leland half-waves at first and it looks glitchy
# and we don't want to show that, so we hide it and wait for the
# real wave to start.
def leland_wave():
	leland_avatar.state(0)
	
	leland_avatar.state(1)
	#leland_avatar.setAnimationSpeed(1,0.75)
	yield viztask.waitTime(WAVE_LAG) # The wave animation starts in the middle of the animation cycle, so wait for it to finish the first one

	arm = leland_avatar.getBone('Bip01 L UpperArm')
	arm.unlock(recurse=1)

	yield viztask.waitTime(3)
	arm.lock(recurse=1)

WAVE_OFFSET = 8
def exit():
	driftOut = vizact.moveTo(LELAND_START_POS, time=16, interpolate=vizact.easeIn)
	
	if condition == NORMAL_LELAND_CONDITION:
		fadeDummy = vizact.fadeTo(LELAND_DEFAULT_ALPHA, time=WAVE_OFFSET)
	elif condition == GHOST_LELAND_CONDITION:
		fadeDummy = vizact.fadeTo(LELAND_GHOST_ALPHA, time=WAVE_OFFSET)
	
	fadeOut = vizact.fadeTo(0, time=16-WAVE_OFFSET)
	fade = vizact.sequence(fadeDummy, fadeOut)

	leave = vizact.parallel(driftOut, fade)
	leland_avatar.addAction(leave)
	leland_head.addAction(leave)
	
	yield viztask.waitTime(WAVE_OFFSET - WAVE_LAG)
	viztask.schedule(leland_wave())

def exitLeland():
	viztask.schedule(exit())

LELAND_ENTRY_OFFSET = 159 #2:39
ENTRY_TO_NOD= 118 #4:37
SMILE_TO_CONVERSATION = 202 #7:59
CONVERSATION_LENGTH = 45 #8:44
CONVERSATION_TO_EXIT = 29 #9:13, wave 9:21, finish fading 9:29
REMAINDER_OF_AUDIO = 34 #9:47

def performLeland():
	yield viztask.waitTime(LELAND_ENTRY_OFFSET)
	print "Leland enters the scene..."
	enterLeland()
	yield viztask.waitTime(ENTRY_TO_NOD)
	print "Leland nods in return"
	leland_nod()
	yield viztask.waitTime(SMILE_TO_CONVERSATION)
	print "Random nodding starts"
	enableRandomNodding()
	yield viztask.waitTime(CONVERSATION_LENGTH)
	print "Random nodding ends"
	disableRandomNodding()
	yield viztask.waitTime(CONVERSATION_TO_EXIT)
	print "Leland exits the scene"
	exitLeland()
	yield viztask.waitTime(REMAINDER_OF_AUDIO)
	print "Simulation has finished"

def performLelandNoWait():
	yield viztask.waitTime(4) #Starts at 2:35
	print "Leland enters the scene..."
	enterLeland()
	yield viztask.waitTime(ENTRY_TO_NOD)
	print "Leland nods in return"
	leland_nod()
	yield viztask.waitTime(SMILE_TO_CONVERSATION)
	print "Random nodding starts"
	enableRandomNodding()
	yield viztask.waitTime(CONVERSATION_LENGTH)
	print "Random nodding ends"
	disableRandomNodding()
	yield viztask.waitTime(CONVERSATION_TO_EXIT)
	print "Leland exits the scene"
	exitLeland()
	yield viztask.waitTime(REMAINDER_OF_AUDIO)
	print "Simulation has finished"

def executeStudy():
	global started
	if started: return
	started = True
	
	playNarrative()
	viztask.schedule(performLeland())

def executeAtEnterLeland():
	global started
	if started: return
	started = True
	
	soundNode2 = viz.addGroup(pos=[0,1.8,1])
	narrativeSound2 = soundNode2.playsound('assets/sounds/leland_narrative_edited_enterLeland.wav')
	narrativeSound2.volume(1.8)
	print 'playing'
	
	viztask.schedule(performLelandNoWait())

def test1():
	leland_head.alpha(.01)
def test2():
	forest.enable(viz.SAMPLE_ALPHA_TO_COVERAGE)

vizact.onkeydown('r',reset)
vizact.onkeydown('1',executeStudy)
vizact.onkeydown('p',executeAtEnterLeland)

if DEBUG_MODE:
	vizact.onkeydown('2',moveLelandNegZ)
	vizact.onkeydown('3',moveLelandPlusZ)
	vizact.onkeydown('4',increaseFog)
	vizact.onkeydown('5',decreaseFog)
	vizact.onkeydown('6',ghostToggle)
	vizact.onkeydown('7',test1)
	vizact.onkeydown('8',test2)
	
	vizact.onkeydown('a', enterLeland)
	vizact.onkeydown('b', leland_nod)
	vizact.onkeydown('c', enableRandomNodding)
	vizact.onkeydown('d', disableRandomNodding)
	vizact.onkeydown('e', exitLeland)