import glob, numpy as np, sys, os
from PIL import Image, ImageFilter
from scipy import ndimage
T=340
fs=sorted(glob.glob('rgba/*.png'))
if not os.path.exists('plate.npy'):
    st=[];ms=[]
    for f in fs[::8]:
        im=np.asarray(Image.open(f)).astype(np.float32)[:T]
        st.append(im[...,:3]); ms.append(im[...,3]<60)
    st=np.stack(st); ms=np.stack(ms)
    st[~ms]=np.nan
    plate=np.nanmedian(st,axis=0)
    plate=np.where(np.isnan(plate),0,plate)
    np.save('plate.npy',plate); np.save('platevalid.npy',ms.sum(0)>2)
plate=np.load('plate.npy'); valid=np.load('platevalid.npy')
def fix(path,out):
    im=Image.open(path); arr=np.asarray(im).astype(np.float32)
    a=arr[...,3]/255
    d=np.sqrt(((arr[:T,:,:3]-plate)**2).sum(-1))
    d=ndimage.gaussian_filter(d,1.5)
    k=np.clip((d-18)/22,0,1)
    k=np.where(valid,k,1.0)
    # fade the correction in only above row T-60 -> blend to 1 near T
    w=np.clip((np.arange(T)-(T-60))/60,0,1)[:,None]
    k=np.maximum(k,w)
    k=ndimage.binary_opening(k>0.5,iterations=2).astype(np.float32)*k
    a2=a.copy(); a2[:T]*=k
    lab,n=ndimage.label(a2>0.5)
    if n>1:
        sizes=ndimage.sum(np.ones_like(a2),lab,range(1,n+1)); keep=np.argmax(sizes)+1
        a2*=ndimage.binary_dilation(lab==keep,iterations=3)
    al=Image.fromarray((np.clip(a2,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.9))
    rgb=im.convert('RGB'); rgb.putalpha(al); rgb.save(out)
if sys.argv[1]=='test':
    for n in [1,300,480,700,1000,1200]: fix(f'rgba/{n:05d}.png',f'fx_{n}.png')
else:
    os.makedirs('rgba2',exist_ok=True)
    for f in fs: fix(f,'rgba2/'+f.split('/')[-1])
    print('ok')
