Web VPython 3.1

# Simulating wkbk 3.5

A = vec(10,-17.3,0)
B = vec(-26.0,-15,0)
C = vec(21.0,32.3,0)
R = A + B + C

#render coord system
line_x = cylinder( pos=vec(-50, 0, 0), axis=vec(100, 0, 0), radius=0.1 )
x_axis_label = text( text='x', pos=line_x.pos+line_x.axis )

line_y = cylinder( pos=vec(0, -30, 0), axis=vec(0, 60, 0), radius=0.1 )
y_axis_label = text( text='y', pos=line_y.pos+line_y.axis )

#arrows
A_arrow = arrow()
A_arrow.pos = vec(0,0,0)
A_arrow.axis = A
A_arrow.color = vec(1,1,0)
A_arrow_label = text(text = 'A', pos = A_arrow.pos + A + vec(-4,10,0))

B_arrow = arrow()
B_arrow.pos = A_arrow.pos + A
B_arrow.axis = B
B_arrow.color = vec(1,0,1)
B_arrow_label = text(text = 'B', pos = B_arrow.pos + B + vec(15,5,0))

C_arrow = arrow()
C_arrow.pos = B_arrow.pos + B
C_arrow.axis = C
C_arrow.color = vec(0,1,1)
C_arrow_label = text(text = 'C', pos = C_arrow.pos + C + vec(-15,-15,0))

R_arrow = arrow()
R_arrow.pos = vec(0,0,0)
R_arrow.axis = R
R_arrow.color = vec(1,1,1)
R_arrow_label = text(text = 'R', pos = R_arrow.pos + R + vec(-3,1,0))