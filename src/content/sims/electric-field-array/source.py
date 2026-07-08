Web VPython 3.2

k = 8.99e9
q1 = -1.0e-9
q2 = 1.0e-9
sat_lev = 1
arrow_list = []

if q1 > 0:
    c1 = vec(1,0,0)
else:
    c1 = vec(0,0.2,1)

if q2 > 0:
    c2 = vec(1,0,0)
else:
    c2 = vec(0,0.2,1)

ball1 = sphere()
ball1.pos = vec(0,2,0)
ball1.radius = 0.3
ball1.color = c1
ball1.q = q1

ball2 = sphere()
ball2.pos = vec(3,-2,0)
ball2.radius = 0.3
ball2.color = c2
ball2.q = q2

for x in arange(-5.5,5.5,1):
    for y in arange(-5.5,5.5,1):
        POI = vec(x,y,0)
        r1 = POI - ball1.pos
        r2 = POI - ball2.pos
    
        if (mag(r1) == 0) or (mag(r2) == 0):
            E_field = vec(0,0,0) #db0
        else:
            E_1 = k*ball1.q*r1/mag(r1)**3
            E_2 = k*ball2.q*r2/mag(r2)**3
            E_field = E_1 + E_2
        
        if mag(E_field) > sat_lev:
         E_field = hat(E_field) * sat_lev
        
        E_arrow = arrow()
        E_arrow.pos = POI
        E_arrow.axis = E_field
        E_arrow.color = color.white
        arrow_list.append(E_arrow)
    

