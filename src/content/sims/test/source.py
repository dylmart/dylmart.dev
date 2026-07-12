Web VPython 3.2

    t = 0
    dt = 0.01 
    sim_speed = 1
        
    while (t < 5) and abs(block1.pos.x - block4.pos.x) < block4.width / 2.0:
        rate(sim_speed / dt)
       
        block1.v.x += a_1 * dt
        block4.v.x += a_2 * dt
    
        block1.pos += block1.v * dt
        block4.pos += block4.v * dt
        
        string.pos = vec(block4.pos.x + 1, block4.pos.y, 0)
        
        scene.camera.pos = vec(block4.pos.x, 5, 15)


        t += dt