Web VPython 3.2
# define constants
k=8.99e9        #units of N*m^2/C^2
scale_factor = 2e-4

#place point charges
#charge given in units of C
ball1 = sphere(pos=vec(-2.5,0,0), radius= 0.5, color = vec(0,1,1))
ball1_label = label(pos=ball1.pos+vec(ball1.radius,0,0),text='Q<sub>1</sub>=-q')
ball1.q=-3e-3

ball2 = sphere(pos=vec(2.5,0,0), radius= 0.5, color = vec(0,1,1))
ball2_label = label(pos=ball2.pos+vec(ball2.radius,0,0),text='Q<sub>2</sub>=-q')
ball2.q = ball1.q

ball3 = sphere(pos=vec(0,4.33,0), radius= 0.5, color = vec(0,1,1))
ball3_label = label(pos=ball3.pos+vec(ball3.radius,0,0),text='Q<sub>3</sub>=-q')
ball3.q = ball1.q

ball4 = sphere(pos=vec(0,ball3.pos.y/3,0), radius= 0.5, color = vec(1,0,0))
ball4_label = label(pos=ball4.pos+vec(ball4.radius,0,0),text='Q<sub>4</sub>=q')
ball4.q = -ball1.q


r_1to4 = ball4.pos-ball1.pos
F_1on4 = k*ball4.q*ball1.q*r_1to4/mag(r_1to4)**3
F_1on4_arrow = arrow(pos=ball4.pos, axis=scale_factor*(F_1on4), color = ball1.color)
F14_arrow_label = label(pos=ball4.pos+F_1on4_arrow.axis, text='<i>F</i><sub>14</sub>')

r_2to4 = ball4.pos-ball2.pos
F_2on4 = k*ball4.q*ball2.q*r_2to4/mag(r_2to4)**3
F_2on4_arrow = arrow(pos=ball4.pos, axis=scale_factor*(F_2on4), color = ball1.color)
F24_arrow_label = label(pos=ball4.pos+F_2on4_arrow.axis, text='<i>F</i><sub>24</sub>')

r_3to4 = ball4.pos-ball3.pos
F_3on4 = k*ball4.q*ball3.q*r_3to4/mag(r_3to4)**3
F_3on4_arrow = arrow(pos=ball4.pos, axis=scale_factor*(F_3on4), color = ball1.color)
F34_arrow_label = label(pos=ball4.pos+F_3on4_arrow.axis, text='<i>F</i><sub>34</sub>')

print('vec14 = ' + F_1on4)
print('vec24 = ' + F_2on4)
print('vec34 = ' + F_3on4)