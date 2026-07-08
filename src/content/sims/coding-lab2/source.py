Web VPython 3.2

g = 9.81
mass1 = 1
mass4 = 4
massTOT = mass1 + mass4

scale_arrow = 0.5

floorBlock = box(length = 20, 
                width = 20,
                height = 0.1,
                color = vec(1,1,1))
floorBlock.pos = vec(0,0,0)

# These need to be changable by user
T_MAG = 34.4

angle_degrees = 30
theta = radians(angle_degrees)

# mu_k < mu_s
mu_s_Boxes = 0.8
mu_k_Boxes = 0.3

mu_s_Floor = 0.7
mu_k_Floor = 0.5

#Tension
T = vec(0,0,0)
T.x = (T_MAG * cos(theta))
T.y = (T_MAG * sin(theta))

#Friction
sysFriction = mu_k_Floor * ((massTOT) - T.y)

#Acceleration
sysAccel = (T.x - sysFriction) / (massTOT)
maxAccel = mu_s_Boxes * g

#----------------Render-Objects---------------

block1 = box(length = 1,
            width = 1,
            height = 1,
            color = vec(0,1,1))
block1.pos = vec(0,4.5,0)


block4 = box(length = 4,
            width = 4,
            height = 4,
            color = vec(1,0,1))
block4.pos = vec(0,2,0)


string = cylinder()
string.pos = vec(block4.pos.x + 2, block4.pos.y, 0)
string.radius = 0.05
string.length = 7

string.rotate(angle = theta, 
            axis = vec(0,0,1), 
            origin = vec(block4.pos.x + 2,block4.pos.y,0))
            
#---------------Time-&-Motion---------------------

t = 0
dt = 0.01
sim_speed = 1

block1.v = vec(0,0,0)
block4.v = vec(0,0,0)

block1.a = vec(0,0,0)
block4.a = vec(0,0,0)

#---------------Catches & Time Loop----------------

T_MIN = ((mu_s_Floor * massTOT * g) / (cos(theta) + mu_s_Floor * sin(theta)))

if (T.y > massTOT * g):
    print("ERROR: Tension lifts blocks off ground.")

else if (T_MAG < T_MIN):
    print("Not enough tension to move blocks.")
    
else:
    while((t < 5) and (abs(block1.pos.x - block4.pos.x) == 0)):
        rate(sim_speed / dt)
    
        #If the acceleration is fast enough to make the top block move
        #relative to the bottom block, then we use different force eq's
        if (sysAccel > maxAccel):
            print("too fast")
            
            friction1 = mu_k_Boxes * mass1 * g
            accel1 = friction1 / mass1
            
            friction4 = mu_k_Floor * (massTOT - T.y)
            accel2 = (T.x - friciton4 - friction1) / mass4
        else:
            print("not too fast")
        t += dt
        
        