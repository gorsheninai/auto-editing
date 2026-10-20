import glob, numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove
from scipy import ndimage
s=new_session('u2net_human_seg')
fs=sorted(glob.glob('fr/*.png'))
for f in fs:
    n=f.split('/')[-1]
    m=np.asarray(remove(Image.open(f),session=s,only_mask=True)).astype(np.float32)/255
    lab,k=ndimage.label(m>0.5)
    if k>1:
        sizes=ndimage.sum(np.ones_like(m),lab,range(1,k+1)); keep=np.argmax(sizes)+1
        grow=ndimage.binary_dilation(lab==keep,iterations=6)
        m=m*grow
    mi=Image.fromarray((m*255).astype(np.uint8)).resize((720,1280),Image.BILINEAR).filter(ImageFilter.GaussianBlur(1.2))
    rgb=Image.open('full/'+n).convert('RGB'); rgb.putalpha(mi); rgb.save('rgba/'+n)
print('done')
