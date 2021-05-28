tijdsschaal = 0.1
afstandsschaal = 10

import bpy
import json

with open('/home/arte/dev/annod/opslag/stations.json') as data_file:
    stations = json.load(data_file)

with open('/home/arte/dev/annod/opslag/alleritjes.json') as data_file:
    ritten = json.load(data_file)

for obj in bpy.context.scene.objects:
    obj.select_set(True)

bpy.ops.object.delete()

for station in stations:
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.1,
        depth=1440 * tijdsschaal,
        enter_editmode=False,
        align='WORLD',
        location=(
            station['coordinaat'][0] * afstandsschaal,
            station['coordinaat'][1] * afstandsschaal,
            720 * tijdsschaal
        ),
        scale=(1, 1, 1)
    )

    
for rit in ritten:
    lijn = rit['lijn']
    for i in range(len(lijn) - 1):
        
        ritnummer = 'e'
 
        # Define arrays for holding data    
        vertex = [
            (lijn[i]['lat'], lijn[i]['lng'], lijn[i]['hoogte']),
            (lijn[i]['lat'], lijn[i]['lng'], lijn[i]['hoogte'] + 1),
            (lijn[i + 1]['lat'], lijn[i + 1]['lng'], lijn[i + 1]['hoogte']),
            (lijn[i + 1]['lat'], lijn[i + 1]['lng'], lijn[i + 1]['hoogte'] + 1),
        ]
        
        faces = [(0, 1, 3, 2)]
        mesh = bpy.data.meshes.new(ritnummer)        

        object = bpy.data.objects.new(ritnummer, mesh)

        bpy.context.scene.collection.objects.link(object)
        
        # Generate mesh data
        mesh.from_pydata(vertex, [], faces)
        # Calculate the edges
        mesh.update(calc_edges=True)
