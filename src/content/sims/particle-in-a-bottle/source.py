Web VPython 3.2

mu_0 = 4e-7*pi      # Units T*m/A
N = 1               # Num Turns
scale = 1e4
coil = []

# Rings
coil1 = ring()
coil1.pos = vec(-10, 0, 0)
coil1.radius = 5
coil1.i = 42069

coil2 = ring()
coil2.pos = vec(10, 0, 0)
coil2.radius = 5
coil2.i = 42069

# Point Charge
charge = sphere()
charge.q = 1.602e-19
charge.color = color.red
charge.radius = 1

# More Variables


B_tot = vec(0,0,0)
B_tot_arrow = arrow()
