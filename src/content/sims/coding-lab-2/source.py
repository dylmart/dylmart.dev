Web VPython 3.2

# ------ variables -------
g = 9.8 # meters per second squared

T_mag = 50 # N optimal force 50.04
T = vec(0, 0, 0)
angle_degrees = 0 # optimal angle 21.8 
theta = radians(angle_degrees)

T.x = T_mag * cos(theta)
T.y = T_mag * sin(theta)

m_1 = 5.0 # kilograms
m_4 = 1 # kilograms
m_tot = m_1 + m_4 # kilograms

mu_S_Floor = 0.5
mu_K_Floor = 0.4

mu_S_Blocks = 0.7
mu_K_Blocks = 0.6

T_min = (mu_S_Floor * m_tot * g) / (cos(theta) + (mu_S_Floor * sin(theta)))

weight = m_tot * g

n2_floor = ((m_tot * g) - T.y)

Fric_1 = mu_S_Blocks * m_1 * g
Fric_4 = mu_K_Floor * n2_floor
Fric_sys = 0
#------------------------

# ------ 3D stuff  -------
arrow_scale = 5.0

block1 = box(size=vec(2, 2, 2))
block4 = box(size=vec(4, 4, 4))

block1.pos = vec(0, block4.pos.y + block4.height / 2.0 + block1.height / 2.0, 0)

block1.v = vec(0, 0, 0)
block4.v = vec(0, 0, 0)

block4.texture = "https://cdn.pixabay.com/photo/2015/04/04/19/13/four-706894_1280.jpg"
block1.texture = "https://img.lovepik.com/element/40102/9512.png_860.png"

floor = box(size=vec(200,0.05,200), color=vec(1,1,1))
floor.pos = vec(0, -2 ,0)
floor.rotate(angle = ((3*pi)/2),
                axis = vec(0,1,0))
floor.texture = "https://thumbs.dreamstime.com/b/vector-transparent-checkerboard-pattern-background-illustration-134543437.jpg"

wall = box(size=vec(20, 0.05, 20), color=vec(1, 1, 1))
wall.pos=vec(85.745, 8, 0)
wall.rotate(angle=(pi/2), axis=vec(0, 0, 1))
wall.rotate(angle=(pi/2), axis=vec(1, 0, 0), origin=wall.pos)
wall.texture = "https://yt3.ggpht.com/a/AATXAJxzYEDhAkHMZ3SVpU-SHksgMiAiGUsl_bI-yMJAeg=s900-c-k-c0xffffffff-no-rj-mo"

string = cylinder()
string.pos = vec(block4.pos.x + 1, block4.pos.y, 0)
string.radius = 0.25
string.length = 20
string.rotate(angle = theta,
                axis = vec(0,0,1),
                origin = vec(block4.pos.x + 1, block4.pos.y, 0))
string.color = color.white

scene.camera.pos = vec(block4.pos.x, 5, 15)

# --------------------

if T.y > weight:
    print("Error: Too much force, lifting blocks off the ground")
    return 0

if T_mag < T_min:
    print("Error: T isn't large enough to start movement")
    print(f"T Min: {T_min:.3f} N | T input {T_mag:.3f} N")
    
    Fric_1 = 0 # N
    Fric_4 = T.x
else:
    
    aMax = mu_S_Blocks * g
    
    Fric_sys = mu_K_Floor * n2_floor
    a_sys = (T.x - Fric_sys) / m_tot
 
    if a_sys > aMax:
        print("Acceleration is too great, doesn't move in unison")
        print(f"A Max: {aMax:.3f} m/s^2 | System A: {a_sys:.3f} m/s^2")
        
        Fric_1 = mu_K_Blocks * m_1 * g
        a_1 = Fric_1 / m_1
        
        Fric_4 = mu_K_Floor * n2_floor
        a_2 = (T.x - Fric_4 - Fric_1) / m_4
        
        print(f"Top Accel: {a_1:.3f} m/s")
        print(f"Botom Accel: {a_2:.3f} m/s")
    else:
        print(f"System Accel: {a_sys:.3f} m/s^2")
        a_1 = a_sys
        a_2 = a_sys
        Fric_1 = a_sys * m_1
    
    t = 0
    dt = 0.001 # accurate time is dt = 0.001
    sim_speed = 1
    
    #print("[t], [x1], [v1], [a1], [x2], [v2], [a2]")
    
    while (t < 5) and abs(block1.pos.x - block4.pos.x) < block4.width / 2.0:
        rate(sim_speed / dt)
       
        #print(\
        #    f"{t:.2f}, {block1.pos.x:.2f}, {block1.v.x:.2f}, {a_1:.2f}, {block4.pos.x:.2f}, {block4.v.x:.2f}, {a_2:.2f}")
        
        block1.v.x += a_1 * dt
        block4.v.x += a_2 * dt
    
        block1.pos += block1.v * dt
        block4.pos += block4.v * dt
        
        string.pos = vec(block4.pos.x + 1, block4.pos.y, 0)
        
        scene.camera.pos = vec(block4.pos.x, 5, 15)


        t += dt
    

print(f"{block4.pos.x:.3f} m")
print(f"Normal force between bottom block and floor: {n2_floor:.2f} N")
print(f"Friction between blocks: {Fric_1:.2f} N")
print(f"Friction between block and floor: {Fric_4:.2f} N")
print("Sim finished")
