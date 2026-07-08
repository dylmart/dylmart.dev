Web VPython 3.2
YOYO_TEXTURE = "https://images.template.net/103776/brown-checkered-background-gvws1.jpg"

# Real World Constants

# === Blocks === 
# These are real world measured Constants:
# Diagonal Blocks = 0.242 m
# side length = 17.1cm -> 0.171m
# block thickness = 2.5cm -> 0.025m
# Plate Individual Mass = 422.95g -> 0.42295kg
# Axel Mass = 55.0g -> 0.055kg
# Axel Diameter = 0.0508m
# String Length = 131.5cm -> 1.315m
# === ====== === 
BLOCK_DIAGONAL = 0.242 #m
BLOCK_SIDE_LENGTH = 0.171 #m
BLOCK_THICKNESS = 0.025 #m
INDIV_PLATE_MASS = 0.42295 #kg
BLOCK_AXEL_MASS = 0.055 #kg
BLOCK_AXEL_DIAM = 0.0508 #m
BLOCK_AXEL_RAD = BLOCK_AXEL_DIAM / 2.0
BLOCK_STRING_LENGTH = 1.315 #m


# === Cylinders 1 ===
# These are real world measured Constants:
# Axel Radius = 3.5cm -> 0.035m
# Axel Mass = 5.89g -> 0.00589kg
# Plate 1 Mass = 129.22g -> 0.12922kg
# Plate 2 Mass = 122.70g -> 0.12270kg
# String length = 130cm -> 0.130m
# === ========= = ===
CYL1_AXEL_RAD = 0.035 #cm
CYL1_AXEL_MASS = 0.00589 #kg
CYL1_P1_MASS = 0.12922 #kg
CYL1_P2_MASS = 0.12270 #kg
CYL1_THICKNESS = BLOCK_THICKNESS  / 5.0
CYL1_RAD = BLOCK_DIAGONAL / 2.0
CYL1_STRING_LENGTH = 0.130 #m

# === Cylinders 2 ===
# These are real world measured Constants:
# Axel Radius = 1.5cm -> 0.015m
# Axel Mass = 5.20g -> 0.00520kg
# Plate 1 Mass = 122.3g -> 0.1223kg
# Plate 2 Mass = 123.6g -> 0.1236kg
# String length = 171.5cm -> 0.1715m
#=== ========= = ===
CYL2_AXEL_RAD = 0.015 #m
CYL2_AXEL_MASS = 0.00520 #kg
CYL2_P1_MASS = 0.1223 #kg
CYL2_P2_MASS = 0.1236 #kg
CYL2_THICKNESS = CYL1_THICKNESS
CYL2_RAD = CYL1_RAD
CYL2_STRING_LENGTH = 0.1715 #m

# mass of 1 square = 422.95g -> 0.42295 kg
# mass of cylinder = 55.0g -> 0.055 kg
# cylinder diam = 0.0508m
# cylinder length = 40 mm 0.040 m
# string max length = 131.5cm -> 1.315m

g = 9.8 # meters per second squared

string_max_length = 1.315 #meters

rot_axis=vec(0, 0, 1)

#spool constants
spool_diam = 0.0508 #meters
spool_rad = spool_diam / 2 #meters
spool_length = 0.04 # meters
spool_mass = 0.055 # kilograms

#block constants
block_side_length = 0.171 #meters
block_diagonal = 0.242 #meters
block_thickness = 0.025 #meters
block_mass = 0.42295 #kilograms

total_mass = (2*block_mass) + spool_mass

#block1 = box(axis=vec(0, 0, 1), color=vec(0, 1, 0))
#block1.size=vec(block_thickness, block_side_length, block_side_length)
#block1.opacity = 0.3

#block2 = box(axis=vec(0, 0, 1), color=vec(0, 1, 0))
#block2.size=vec(block_thickness, block_side_length, block_side_length)
#block2.pos=vec(0, 0, axle.pos.z + axle.length + block_thickness/2)
#block2.opacity=0.3

### UI ###

do_square = True # default
do_disk = False

# Radio buttons (disk or square)

def R_square(square):
    do_square = square.checked

radio(bind=R_square, text='Squares', name = 'group') # text to right of button

def R_disk(disk): 
    do_disk = disk.checked
    
radio(bind=R_disk, text='Disks\n\n', name = 'group') # text to right of button

# Inputs for parameters

def input_string(string_length):
    global input_str
    input_str = string_length.number
winput( bind=input_string, prompt='String length (cm): ' )
scene.append_to_caption('\n')

def input_axle(axle_radius):
    global input_ax
    input_ax = axle_radius.number
winput( bind=input_axle, prompt='Axle Radius (cm): ' )
scene.append_to_caption('\n')

def input_p_mass(plate_mass):
    global input_mass
    input_mass = plate_mass.number
winput( bind=input_p_mass, prompt='Mass per plate (g): ' )
scene.append_to_caption('\n')

def input_p_size(plate_size):
    global input_size
    input_size = plate_size.number
    print(input_size, plate_size.number)
winput( bind=input_p_size, prompt='Size of plates\nFor squares, measures edge to edge. For disks, measures diameter (cm): ' )
scene.append_to_caption('\n')
print(input_size)

# Run button

def B(run):
    print("The button said run")
    print('String length: ' + input_str)
    print('Axle radius: ' + input_ax)
    print('Plate mass: ' + input_mass)
    print('Plate size: ' + input_size)
button( bind=B, text='Run')
scene.append_to_caption('\n')

### ## ###

I_CM = 0
axle = cylinder(radius=0.05, axis=rot_axis, color=vec(1, 0, 0))
axle.length = spool_length
axle.pos = vec(0, 0, BLOCK_THICKNESS / 2)


scene.waitfor('click')    

if yoyo_type_menu.selected == "Square Sides":
    print("Setting up Squares")
    
    plate1 = box(pos=vec(0, 0, 0), axis=rot_axis, color=vec(0, 0, 1))
    plate1.size=vec(BLOCK_THICKNESS, BLOCK_SIDE_LENGTH, BLOCK_SIDE_LENGTH)
    plate1.opacity = 0.3
    
    plate2 = box(axis=rot_axis, color=vec(0, 1, 0))
    plate2.size=vec(BLOCK_THICKNESS, BLOCK_SIDE_LENGTH, BLOCK_SIDE_LENGTH)
    plate2.pos=vec(0, 0, axle.pos.z + axle.length + (BLOCK_THICKNESS / 2))
    plate2.opacity = 0.3
    
    total_mass = 2 * INDIV_PLATE_MASS + BLOCK_AXEL_MASS
    
    string_max_length = BLOCK_STRING_LENGTH
    
    I_CM = ((1/6) * INDIV_PLATE_MASS * (BLOCK_DIAGONAL**2)) + ((1/8) * BLOCK_AXEL_MASS * (BLOCK_AXEL_DIAM**2))
    
    print(f"I Center of Mass: {I_CM}")
    
    yoyo=compound([plate1, plate2, axle])
    yoyo.alpha = vec(0, 0, 0)
    yoyo.omega = vec(0, 0, 0)
    yoyo.vel = vec(0, 0, 0)
    yoyo.texture = YOYO_TEXTURE
    
    ceiling = box(pos=vec(0, plate1.height, 0))
    ceiling.size=vec(0.5, 0.05, 0.5)
    
    string = cylinder(radius=axle.radius / 5, axis=vec(0, -1, 0), pos=ceiling.pos)
    string.pos.x -= axle.radius
    string.pos.z = axle.pos.z + (axle.length / 2)
    string_start_length = ceiling.pos.y - yoyo.pos.y
    string.length = string_start_length
    
    yoyo.alpha = vec(0, 0, (axle.radius * total_mass * g) / (I_CM + (total_mass * (axle.radius**2))))

    print(scene.camera.pos)

    run_sim()
elif yoyo_type_menu.selected == "Disks, Big Axle":
    print("Setting up Cyl 1")
    
    axle.pos = vec(0, 0, CYL1_THICKNESS / 2)
    
    plate1 = cylinder(radius=CYL1_RAD, axis=rot_axis, color=vec(0, 0, 1))
    plate1.length = CYL1_THICKNESS
    plate1.opacity = 0.3
    
    axle.radius = CYL1_AXEL_RAD
    
    plate2 = cylinder(radius=CYL1_RAD, axis=rot_axis, color=vec(0, 1, 0))
    plate2.length = CYL1_THICKNESS
    plate2.pos = vec(0, 0, axle.pos.z + axle.length + (CYL1_THICKNESS / 2))
    plate2.opacity = 0.3
    
    total_mass = CYL1_P1_MASS + CYL1_P2_MASS + CYL1_AXEL_MASS
    
    string_max_length = CYL1_STRING_LENGTH
    
    I_CM = ((1/2) * CYL1_P1_MASS * CYL1_RAD) + ((1/2) * CYL1_P2_MASS * CYL1_RAD) \
           + ((1/2) * CYL1_AXEL_MASS * CYL1_AXEL_RAD)
    print(f"I Center of Mass: {I_CM}")
    
    yoyo=compound([plate1, plate2, axle])
    yoyo.alpha = vec(0, 0, 0)
    yoyo.omega = vec(0, 0, 0)
    yoyo.vel = vec(0, 0, 0)
    yoyo.texture = YOYO_TEXTURE
    
    ceiling = box(pos=vec(0, plate1.height, 0))
    ceiling.size=vec(0.5, 0.05, 0.5)
    
    string = cylinder(radius=axle.radius / 5, axis=vec(0, -1, 0), pos=ceiling.pos)
    string.pos.x -= axle.radius
    string.pos.z = axle.pos.z + (axle.length / 2)
    string_start_length = ceiling.pos.y - yoyo.pos.y
    string.length = string_start_length
    
    yoyo.alpha = vec(0, 0, (axle.radius * total_mass * g) / (I_CM + (total_mass * (axle.radius**2))))
    
    run_sim()

elif yoyo_type_menu.selected == "Disks, Small Axle":
    print("Setting up Cyl 2")
    
    axle.pos = vec(0, 0, CYL2_THICKNESS / 2)
    
    plate1 = cylinder(radius=CYL2_RAD, axis=rot_axis, color=vec(0, 0, 1))
    plate1.length = CYL2_THICKNESS
    plate1.opacity = 0.3
    
    axle.radius = CYL2_AXEL_RAD
    
    plate2 = cylinder(radius=CYL2_RAD, axis=rot_axis, color=vec(0, 1, 0))
    plate2.length = CYL2_THICKNESS
    plate2.pos = vec(0, 0, axle.pos.z + axle.length + (CYL2_THICKNESS / 2))
    plate2.opacity = 0.3
    
    total_mass = CYL2_P1_MASS + CYL2_P2_MASS + CYL2_AXEL_MASS
    
    string_max_length = CYL2_STRING_LENGTH
    
    I_CM = ((1/2) * CYL2_P1_MASS * CYL2_RAD) + ((1/2) * CYL2_P2_MASS * CYL2_RAD) \
           + ((1/2) * CYL2_AXEL_MASS * CYL2_AXEL_RAD)
    print(f"I Center of Mass: {I_CM}")
    
    yoyo=compound([plate1, plate2, axle])
    yoyo.alpha = vec(0, 0, 0)
    yoyo.omega = vec(0, 0, 0)
    yoyo.vel = vec(0, 0, 0)
    yoyo.texture = YOYO_TEXTURE
    
    ceiling = box(pos=vec(0, plate1.height, 0))
    ceiling.size=vec(0.5, 0.05, 0.5)
    
    string = cylinder(radius=axle.radius / 5, axis=vec(0, -1, 0), pos=ceiling.pos)
    string.pos.x -= axle.radius
    string.pos.z = axle.pos.z + (axle.length / 2)
    string_start_length = ceiling.pos.y - yoyo.pos.y
    string.length = string_start_length
    
    yoyo.alpha = vec(0, 0, (axle.radius * total_mass * g) / (I_CM + (total_mass * (axle.radius**2))))
    
    run_sim()

def run_sim():
    t=0
    dt=0.01
    sim_speed = 1
    scene.waitfor('click')
    while (string.length - string_start_length) < string_max_length:
        rate(sim_speed/dt)
    
        yoyo.omega += yoyo.alpha * dt
        dtheta = dot(yoyo.omega, rot_axis) * dt
        yoyo.rotate(axis=-rot_axis, origin=yoyo.pos, angle=dtheta)
    
        # using wheel of pain we know that the radius has to be in the i_hat
        # that way the resulting vector will only have a j_hat component, becuase
        # i_hat X k_hat = -j_hat which is exactly what we want.
        yoyo.vel = cross(vec(axle.radius, 0, 0), yoyo.omega)
        yoyo.pos += yoyo.vel * dt
        
        # calculate arc length to add to string
        S = axle.radius * dtheta
        string.length += S
    
    
        scene.camera.pos = vec(yoyo.pos.x, yoyo.pos.y, yoyo.pos.z + 0.648)
    
        t+=dt
    
    print(f"Time: {t}s")
    print(f"String Length: {string.length - string_start_length}m")

    

    
### FUNCTIONS ###


