Web VPython 3.2

M = 10
R = 2.0
x_min = -R
x_max = R
y_min = 0
y_max = y_min + R
dx = 0.2
dy = dx

#draw coordinates
line_x=cylinder(pos=vec(-1.1*R, 0, 0), axis=vec(2.2*R, 0, 0), radius=0.05)
line_y=cylinder(pos=vec(0, -1.1*R, 0), axis=vec(0, 2.2*R, 0), radius=0.05)

#reduce output visualization window height
#should make it easier to read print statements
scene.height = 200

numer = vec(0,0,0)      #initialize NUMERATOR of center of mass formula
denom = 0               #initialize DENOMINATOR of center of mass formula
plate = []              #initialize list for organizational purposes
N = 0                   #counter for total number of balls drawn

#create a pair of nested for loops to draw the spheres
#use an if statement to determine if the ball should be drawn or not
#the if statment should relate to the slope of the line of the triangle
#set the vertex of the triangle at the origin
#if a ball is drawn, increment the counter N
#remember to shift the horiz. & vert. coords. of each ball by dx/2 & dy/2
#set each ball's opacity to somewhere in the 0.3 to 0.5 range

for x in arange(x_min+(dx/2), x_max, dx):
    for y in arange(y_min+(dy/2), y_max, dy):
        rate(1000)
        if y <= sqrt(R**2 - x**2):
            ball = sphere()
            ball.pos = vec(x,y,0)
            ball.opacity = 0.5
            ball.radius = dx/2
            
            plate.append(ball)
            
            N += 1

#note: we don't yet know the mass of each ball
#after computing the mass per ball in the next step
#you should be able to make a single FOR loop to compute the COM

#after the loops are done, print out total number of balls & mass per ball
dm = M/N
print("Total mass = "+M)
print("Total number of balls = "+N)
print(f"Mass per ball = {dm:.3f}")

#note: now that you know the mass for each ball
#compute the COM with a single FOR loop

for balls in plate:
    numer += balls.pos*dm
    denom += dm

#compute the center of mass
#notice this gives (Sum of x_i*m_i)/(total mass)
COM = numer/denom
print('Center of mass is at'+COM+'.')
COM_indicator = sphere(pos=COM, color=vec(1, 0.2, 0.8))
COM_indicator.radius = 0.5

#this line of code centers the camera on the COM
#scene.center = COM

#compute theoretical COM.x
#for trianglular plate, should be 1/3 from the fat end
COM_th = vec(0, 0.422*R, 0)
#p_diff_COMx = (COM.x - COM_th.x)/COM_th.x*100
#print(f"% diff for COM_x = {p_diff_COMx:.3f}")

#compute theoretical COM.y
#for trianglular plate, should be 1/3 from the fat end
p_diff_COMy = (COM.y - COM_th.y)/COM_th.y*100
print(f"% diff for COM_y = {p_diff_COMy:.3f}")