Web VPython 3.2

# ----- variables -----
m1 = 1
# use powers of 100
# WARNING: DISABLE GRAPH FOR VALUES > 100,000,000
m2 = 1000000

# time stuff for sim
# decrease dt for high m2 values!
dt = 0.000001
t = 0
sim_speed = 1

draw_graph = True

scene.camera.pos = vec(10, 3, 15)

# v2 doesn't change outcome of colission number
v1 = 0
v2 = -10

print(f"Red Block Mass: {m1:,}g")
print(f"Blue Block Mass: {m2:,}g")

# ------ 3D stuff  -------
block1 = box(size=vec(1,1,1), color=color.red)
block2 = box(size=vec(1,1,1), color=color.blue)

block1.pos = vec(10, block1.height / 2, 0)
block2.pos = vec(15, block2.height / 2, 0)

block1.velocity = vec (v1, 0, 0)
block2.velocity = vec (v2, 0, 0)

floor = box(size=vec(1002,0.05,5))
floor.pos = vec(501, 0 ,0)

wall = box(size=vec(2,8,5))
wall.pos = vec(-1,4,0)

# ----- Graph -----
circle_graph = graph(title="rho2 vs rho1")

cg = gcurve(graph=circle_graph, color=color.orange)

# ----- Sim -----

num_collisions = 0

while (!((block1.velocity.x > 0) and (block1.velocity.x < block2.velocity.x))):
    rate(sim_speed/dt)
    
    # avoid setting block positions to zero
    if block1.velocity.x != 0:
        block1.pos += block1.velocity * dt
    if block2.velocity.x != 0:
        block2.pos += block2.velocity * dt
        
    b1vx = block1.velocity.x
    b2vx = block2.velocity.x
    
    
    overlap = (block2.width + block1.width)/2 - abs(block1.pos.x - block2.pos.x)
    if (overlap > 0):
        block1.pos.x -= overlap * (m2 / (m1+m2))
        block2.pos.x += overlap * (m1 / (m1+m2))
    
    # if blocks collide
    if abs(block1.pos.x - block2.pos.x) <= 1:
            
        block1.velocity.x = ((m1 - m2) / (m1 + m2)) * b1vx + (2 * m2 / (m1 + m2)) * b2vx
        block2.velocity.x = ((m2 - m1) / (m1 + m2)) * b2vx + (2 * m1 / (m1 + m2)) * b1vx
        
        # graph
        if block1.velocity.x != 0 and draw_graph:
            cg.plot(m2*b2vx, m1*b1vx)
        num_collisions+=1
        
    # if block1 hits wall
    if (block1.pos.x <= (block1.height/2)):
        block1.velocity.x = -block1.velocity.x
        
        # graph
        if block1.velocity.x != 0 and draw_graph:
            cg.plot(m2*b2vx, m1*b1vx)
        num_collisions+=1
        
    t+=dt
    
print(f"Number of Collisions: {num_collisions:,}")        