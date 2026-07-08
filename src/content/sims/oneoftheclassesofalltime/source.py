Web VPython 3.2
ball1 = sphere(pos=vec(3,4,0), radius= 0.5, color = vec(1,0,1))
ball2 = sphere(pos=vec(-2,1,0), radius= 1.5, color = vec(1,1,0))

print("ball 1's position vector in meters is: " + ball1.pos)

print("ball 1's magnitude is: "mag(ball1.pos))

A = vec(1,2,3)
B = vec(-1,2,-5)

C = A+B
print("C is: " + C)

print("x-comp of C is: "+C.x)

frog = arrow(pos=ball1.pos, axis=C)