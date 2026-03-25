'use client'

import { useEffect, useRef } from 'react'

export default function BlueprintAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let animationId: number
    let threeScript: HTMLScriptElement

    threeScript = document.createElement('script')
    threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    threeScript.onload = () => {
      console.log('Three.js loaded, starting animation')
      const THREE = (window as any).THREE

      const W = window.innerWidth, H = window.innerHeight
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000510, 1)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 1000)
      camera.position.set(22, 16, 22)
      camera.lookAt(0, 4, 0)

      const edges: any[] = []

      function line(x1:number,y1:number,z1:number, x2:number,y2:number,z2:number, color=0xffffff, opacity=1, order=0) {
        const geo = new THREE.BufferGeometry()
        const pos = new Float32Array([x1,y1,z1, x1,y1,z1])
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
        const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity })
        const ln = new THREE.Line(geo, mat)
        scene.add(ln)
        edges.push({ ln, geo, x1,y1,z1, x2,y2,z2, color, opacity, order, progress:0, done:false })
      }

      const W1=0xffffff, DIM=0x334466, BLUE=0x2266ff, CYAN=0x00aaff, GOLD=0xffaa44, RED=0xff4444

      // === MAIN HOUSE BLOCK ===
      // Foundation
      line(-6,0,-4, 6,0,-4, BLUE,.7,0); line(6,0,-4, 6,0,4, BLUE,.7,0)
      line(6,0,4, -6,0,4, BLUE,.7,0); line(-6,0,4, -6,0,-4, BLUE,.7,0)

      // Vertical corners main
      ;[[-6,-4],[-6,4],[6,-4],[6,4]].forEach(([x,z])=>line(x,0,z, x,5,z, W1,.95,1))

      // Wall tops
      line(-6,5,-4, 6,5,-4, W1,.95,2); line(6,5,-4, 6,5,4, W1,.95,2)
      line(6,5,4, -6,5,4, W1,.95,2); line(-6,5,4, -6,5,-4, W1,.95,2)

      // Wall horizontal detail lines
      ;[1,2,3,4].forEach(y=>{
        line(-6,y,-4, 6,y,-4, DIM,.25,2); line(-6,y,4, 6,y,4, DIM,.25,2)
        line(-6,y,-4, -6,y,4, DIM,.25,2); line(6,y,-4, 6,y,4, DIM,.25,2)
      })
      // Wall vertical detail lines
      ;[-4,-2,0,2,4].forEach(x=>{
        line(x,0,-4, x,5,-4, DIM,.2,2); line(x,0,4, x,5,4, DIM,.2,2)
      })
      ;[-2,0,2].forEach(z=>{
        line(-6,0,z, -6,5,z, DIM,.2,2); line(6,0,z, 6,5,z, DIM,.2,2)
      })

      // === WINDOWS FRONT WALL ===
      function window2d(x1:number,y1:number,z:number, x2:number,y2:number, ord:number, col=0x88ccff) {
        line(x1,y1,z, x2,y1,z, col,.9,ord); line(x2,y1,z, x2,y2,z, col,.9,ord)
        line(x2,y2,z, x1,y2,z, col,.9,ord); line(x1,y2,z, x1,y1,z, col,.9,ord)
        line((x1+x2)/2,y1,z, (x1+x2)/2,y2,z, col,.5,ord)
        line(x1,(y1+y2)/2,z, x2,(y1+y2)/2,z, col,.5,ord)
      }
      window2d(-5,1.5,-4.01, -3.2,3.5, 3)
      window2d(-1.5,1.5,-4.01, 1.5,3.5, 3)
      window2d(3.2,1.5,-4.01, 5,3.5, 3)
      // Side windows
      window2d(6.01,1.5,-2.5, 6.01,3.5,-0.5, 3)
      window2d(6.01,1.5,0.5, 6.01,3.5,2.5, 3)
      window2d(-6.01,1.5,-2, -6.01,3.5,2, 3)
      // Back windows
      window2d(-4,1.5,4.01, -2,3.5, 3)
      window2d(2,1.5,4.01, 4,3.5, 3)

      // === MAIN DOOR ===
      line(-1,0,-4.01, -1,2.5,-4.01, CYAN,.9,3); line(-1,2.5,-4.01, 1,2.5,-4.01, CYAN,.9,3)
      line(1,2.5,-4.01, 1,0,-4.01, CYAN,.9,3); line(0,0,-4.01, 0,2.5,-4.01, CYAN,.5,3)
      // Door arch
      for(let a=0; a<=Math.PI; a+=Math.PI/8) {
        const a2=a+Math.PI/8
        line(Math.cos(a)*1+0, 2.5+Math.sin(a)*0.5, -4.01, Math.cos(a2)*1+0, 2.5+Math.sin(a2)*0.5, -4.01, CYAN,.7,3)
      }

      // === MAIN ROOF ===
      const rh=3.5
      line(-6,5,0, 6,5,0, W1,.4,3)
      line(-6,5+rh,0, 6,5+rh,0, W1,1,4)
      line(-6,5,-4, -6,5+rh,0, W1,.9,4); line(6,5,-4, 6,5+rh,0, W1,.9,4)
      line(-6,5,4, -6,5+rh,0, W1,.9,4); line(6,5,4, 6,5+rh,0, W1,.9,4)
      // Roof detail
      for(let x=-5; x<=5; x+=1) {
        line(x,5,-4, x,5+rh,0, DIM,.15,4); line(x,5,4, x,5+rh,0, DIM,.15,4)
      }
      for(let i=0;i<=7;i++) {
        const t=i/7, ry=5+rh*t, dz=4*(1-t)
        line(-6,ry,-dz, 6,ry,-dz, DIM,.2,4)
        if(dz>0) line(-6,ry,dz, 6,ry,dz, DIM,.2,4)
      }

      // === DORMER WINDOWS (roof windows) ===
      function dormer(x:number, ord:number) {
        line(x-0.8,6.5,-1.2, x+0.8,6.5,-1.2, CYAN,.8,ord)
        line(x+0.8,6.5,-1.2, x+0.8,7.5,-1.2, CYAN,.8,ord)
        line(x+0.8,7.5,-1.2, x-0.8,7.5,-1.2, CYAN,.8,ord)
        line(x-0.8,7.5,-1.2, x-0.8,6.5,-1.2, CYAN,.8,ord)
        line(x,6.5,-1.2, x,7.5,-1.2, CYAN,.5,ord)
        // dormer roof
        line(x-1,6.3,-1.5, x,7.8,-0.5, W1,.7,ord)
        line(x+1,6.3,-1.5, x,7.8,-0.5, W1,.7,ord)
        line(x-1,6.3,-1.5, x+1,6.3,-1.5, W1,.7,ord)
        line(x-1,6.3,-1.5, x-1,6.3,0.5, W1,.4,ord)
        line(x+1,6.3,-1.5, x+1,6.3,0.5, W1,.4,ord)
      }
      dormer(-3.5, 5); dormer(0, 5); dormer(3.5, 5)

      // === CHIMNEY ===
      function chimney(cx:number, cz:number, ord:number) {
        line(cx-.5,5.5,cz-.4, cx+.5,5.5,cz-.4, W1,.9,ord)
        line(cx+.5,5.5,cz-.4, cx+.5,5.5,cz+.4, W1,.9,ord)
        line(cx+.5,5.5,cz+.4, cx-.5,5.5,cz+.4, W1,.9,ord)
        line(cx-.5,5.5,cz+.4, cx-.5,5.5,cz-.4, W1,.9,ord)
        line(cx-.5,8,cz-.4, cx+.5,8,cz-.4, W1,1,ord)
        line(cx+.5,8,cz-.4, cx+.5,8,cz+.4, W1,1,ord)
        line(cx+.5,8,cz+.4, cx-.5,8,cz+.4, W1,1,ord)
        line(cx-.5,8,cz+.4, cx-.5,8,cz-.4, W1,1,ord)
        line(cx-.5,5.5,cz-.4, cx-.5,8,cz-.4, W1,.9,ord)
        line(cx+.5,5.5,cz-.4, cx+.5,8,cz-.4, W1,.9,ord)
        line(cx+.5,5.5,cz+.4, cx+.5,8,cz+.4, W1,.9,ord)
        line(cx-.5,5.5,cz+.4, cx-.5,8,cz+.4, W1,.9,ord)
        // chimney top cap
        line(cx-.7,8.1,cz-.5, cx+.7,8.1,cz-.5, W1,.8,ord)
        line(cx+.7,8.1,cz-.5, cx+.7,8.1,cz+.5, W1,.8,ord)
        line(cx+.7,8.1,cz+.5, cx-.7,8.1,cz+.5, W1,.8,ord)
        line(cx-.7,8.1,cz+.5, cx-.7,8.1,cz-.5, W1,.8,ord)
      }
      chimney(-3.5, -1.5, 5); chimney(3.5, -1, 5)

      // === LEFT WING EXTENSION ===
      line(-6,0,-4, -10,0,-4, BLUE,.6,1); line(-10,0,-4, -10,0,1, BLUE,.6,1)
      line(-10,0,1, -6,0,1, BLUE,.6,1)
      line(-10,0,-4, -10,3.5,-4, W1,.9,2); line(-10,0,1, -10,3.5,1, W1,.9,2)
      line(-10,3.5,-4, -6,3.5,-4, W1,.9,2); line(-10,3.5,1, -6,3.5,1, W1,.9,2)
      line(-10,3.5,-4, -10,3.5,1, W1,.9,2)
      ;[1,2,3].forEach(y=>{ line(-10,y,-4, -10,y,1, DIM,.2,2); line(-10,y,-4, -6,y,-4, DIM,.2,2) })
      // Wing roof (flat)
      line(-10,3.5,-4, -10,3.5,1, W1,.8,4); line(-10,3.5,-4, -6,3.5,-4, W1,.8,4)
      line(-10,3.5,1, -6,3.5,1, W1,.8,4)
      // Parapet
      line(-10,4,-4, -6,4,-4, W1,.7,4); line(-10,4,1, -6,4,1, W1,.7,4)
      line(-10,4,-4, -10,4,1, W1,.7,4)
      ;[-10,-8].forEach(x=>{ line(x,3.5,-4, x,4,-4, W1,.5,4); line(x,3.5,1, x,4,1, W1,.5,4) })
      // Wing window
      window2d(-9,1,-4.01, -7,3, 3)
      window2d(-9.01,.8,-3, -9.01,2.8,-0.5, 3)

      // === RIGHT WING (conservatory/greenhouse) ===
      line(6,0,-2, 10,0,-2, BLUE,.6,1); line(10,0,-2, 10,0,3, BLUE,.6,1)
      line(10,0,3, 6,0,3, BLUE,.6,1)
      line(6,0,-2, 6,4,-2, W1,.7,2); line(10,0,-2, 10,4,-2, W1,.7,2)
      line(10,0,3, 10,4,3, W1,.7,2); line(6,0,3, 6,4,3, W1,.7,2)
      // Glass walls - many lines for glass effect
      for(let y=0.5;y<4;y+=0.5) {
        line(6,y,-2, 10,y,-2, CYAN,.3,3); line(10,y,-2, 10,y,3, CYAN,.3,3)
        line(10,y,3, 6,y,3, CYAN,.3,3)
      }
      for(let x=7;x<10;x++) { line(x,0,-2, x,4,-2, CYAN,.3,3); line(x,0,3, x,4,3, CYAN,.3,3) }
      for(let z=-1;z<3;z++) { line(10,0,z, 10,4,z, CYAN,.25,3) }
      // Conservatory roof (pyramid)
      line(6,4,-2, 8,5.5,0.5, CYAN,.8,4); line(10,4,-2, 8,5.5,0.5, CYAN,.8,4)
      line(10,4,3, 8,5.5,0.5, CYAN,.8,4); line(6,4,3, 8,5.5,0.5, CYAN,.8,4)
      line(6,4,-2, 10,4,-2, CYAN,.7,4); line(10,4,-2, 10,4,3, CYAN,.7,4)
      line(10,4,3, 6,4,3, CYAN,.7,4); line(6,4,3, 6,4,-2, CYAN,.7,4)
      // Roof detail
      for(let a=0;a<4;a++) {
        const corners2 = [[6,4,-2],[10,4,-2],[10,4,3],[6,4,3]]
        const mid = [8,5.5,0.5]
        const c = corners2[a]
        line(c[0],c[1],c[2], (c[0]+corners2[(a+1)%4][0])/2, c[1]+0.4, (c[2]+corners2[(a+1)%4][2])/2, CYAN,.4,4)
      }

      // === FRONT PORCH ===
      line(-3,0,-4, -3,0,-7, BLUE,.6,5); line(3,0,-4, 3,0,-7, BLUE,.6,5)
      line(-3,0,-7, 3,0,-7, BLUE,.6,5)
      // Porch columns
      ;[[-2.2,-6.5],[-0.7,-6.5],[0.7,-6.5],[2.2,-6.5]].forEach(([x,z])=>{
        line(x,0,z, x,3.2,z, W1,.9,5)
        // column detail
        line(x-.15,0,z-.15, x+.15,0,z-.15, W1,.6,5); line(x+.15,0,z-.15, x+.15,0,z+.15, W1,.6,5)
        line(x+.15,0,z+.15, x-.15,0,z+.15, W1,.6,5); line(x-.15,0,z+.15, x-.15,0,z-.15, W1,.6,5)
        line(x-.2,3,z-.2, x+.2,3,z-.2, W1,.7,5); line(x+.2,3,z-.2, x+.2,3,z+.2, W1,.7,5)
        line(x+.2,3,z+.2, x-.2,3,z+.2, W1,.7,5); line(x-.2,3,z+.2, x-.2,3,z-.2, W1,.7,5)
      })
      // Porch roof/pediment
      line(-3,3,-4, 3,3,-4, W1,.8,5); line(-3,3,-4, -3,3,-7, W1,.8,5)
      line(3,3,-4, 3,3,-7, W1,.8,5); line(-3,3,-7, 3,3,-7, W1,.8,5)
      line(-3,3,-7, 0,4,-5.5, W1,.9,5); line(3,3,-7, 0,4,-5.5, W1,.9,5)
      line(-3,3,-7, 3,3,-7, W1,.9,5)
      // Porch steps
      ;[0.2,0.4,0.6].forEach((y,i)=>{
        const ext = (i+1)*0.4
        line(-(3+ext),y,-(7+ext), (3+ext),y,-(7+ext), W1,.5,5)
        line(-(3+ext),y,-(7+ext), -(3+ext),y,-4, W1,.3,5)
        line((3+ext),y,-(7+ext), (3+ext),y,-4, W1,.3,5)
      })

      // === BALCONY (second floor, back) ===
      line(-4,5,4, 4,5,4, W1,.9,5); line(-4,5,4, -4,5,6, W1,.9,5)
      line(4,5,4, 4,5,6, W1,.9,5); line(-4,5,6, 4,5,6, W1,.9,5)
      line(-4,5,6, -4,3.5,6, W1,.8,5); line(4,5,6, 4,3.5,6, W1,.8,5)
      line(-4,3.5,6, 4,3.5,6, W1,.8,5)
      // Balcony floor
      line(-4,5,4, -4,5,6, W1,.3,5); line(4,5,4, 4,5,6, W1,.3,5)
      for(let x=-3;x<=3;x++) line(x,5,4, x,5,6, DIM,.2,5)
      for(let z=4.5;z<=5.5;z+=0.5) line(-4,5,z, 4,5,z, DIM,.15,5)
      // Balcony railing balusters
      for(let x=-3.5;x<=3.5;x+=0.5) {
        line(x,3.5,6, x,5,6, W1,.4,5)
        line(x,3.5,4.05, x,5,4.05, W1,.3,5)
      }
      for(let z=4.2;z<=5.8;z+=0.5) {
        line(-4.05,3.5,z, -4.05,5,z, W1,.3,5)
        line(4.05,3.5,z, 4.05,5,z, W1,.3,5)
      }
      // French doors to balcony
      line(-1.5,5,4.01, -1.5,3,4.01, CYAN,.9,5); line(1.5,5,4.01, 1.5,3,4.01, CYAN,.9,5)
      line(-1.5,5,4.01, 1.5,5,4.01, CYAN,.9,5)
      line(-1.5,3,4.01, 1.5,3,4.01, CYAN,.5,5); line(0,3,4.01, 0,5,4.01, CYAN,.5,5)
      line(-1.5,4,4.01, 1.5,4,4.01, CYAN,.5,5)

      // === GARAGE ===
      line(-10,0,-8, -4,0,-8, BLUE,.6,2); line(-4,0,-8, -4,0,-4, BLUE,.6,2)
      line(-10,0,-4, -10,0,-8, BLUE,.6,2)
      line(-10,0,-8, -10,3,-8, W1,.9,2); line(-4,0,-8, -4,3,-8, W1,.9,2)
      line(-10,3,-8, -4,3,-8, W1,.9,2); line(-10,3,-4, -10,3,-8, W1,.9,2)
      ;[1,2].forEach(y=>{ line(-10,y,-8, -4,y,-8, DIM,.2,2); line(-10,y,-8, -10,y,-4, DIM,.2,2) })
      // Garage door panels
      for(let y=0.4;y<3;y+=0.4) line(-9,y,-8.01, -5,y,-8.01, DIM,.3,3)
      for(let x=-9;x<=-5;x+=0.5) line(x,0,-8.01, x,3,-8.01, DIM,.2,3)
      line(-9,0,-8.01, -5,0,-8.01, CYAN,.7,3); line(-5,0,-8.01, -5,3,-8.01, CYAN,.7,3)
      line(-5,3,-8.01, -9,3,-8.01, CYAN,.7,3); line(-9,3,-8.01, -9,0,-8.01, CYAN,.7,3)
      // Garage roof
      line(-10,3,-4, -4,3,-4, W1,.7,3); line(-10,3,-8, -10,3,-4, W1,.7,3); line(-4,3,-8, -4,3,-4, W1,.7,3)
      line(-10,3.8,-6, -4,3.8,-6, W1,.8,4); line(-10,3,-8, -10,3.8,-6, W1,.8,4)
      line(-4,3,-8, -4,3.8,-6, W1,.8,4); line(-10,3,-4, -10,3.8,-6, W1,.8,4); line(-4,3,-4, -4,3.8,-6, W1,.8,4)

      // === GARDEN WALL ===
      line(-12,0,-10, 12,0,-10, GOLD,.5,6); line(12,0,-10, 12,0,8, GOLD,.5,6)
      line(-12,0,8, 12,0,8, GOLD,.5,6); line(-12,0,-10, -12,0,8, GOLD,.5,6)
      line(-12,1.5,-10, 12,1.5,-10, GOLD,.5,6); line(12,1.5,-10, 12,1.5,8, GOLD,.5,6)
      line(-12,1.5,8, 12,1.5,8, GOLD,.5,6); line(-12,1.5,-10, -12,1.5,8, GOLD,.5,6)
      // Garden gate
      line(-1,0,-10.01, 1,0,-10.01, GOLD,.7,6); line(-1,2,-10.01, 1,2,-10.01, GOLD,.7,6)
      line(-1,0,-10.01, -1,2,-10.01, GOLD,.8,6); line(1,0,-10.01, 1,2,-10.01, GOLD,.8,6)
      line(0,0,-10.01, 0,2,-10.01, GOLD,.5,6); line(-1,1,-10.01, 1,1,-10.01, GOLD,.5,6)

      // === DIMENSION LINES ===
      const DL=0x2244aa
      line(-13,0,-10, -13,0,8, DL,.5,7); line(-13,0,-10, -12.5,0,-10, DL,.4,7); line(-13,0,8, -12.5,0,8, DL,.4,7)
      line(-12,0,-11, 12,0,-11, DL,.5,7); line(-12,0,-11, -12,0,-10.5, DL,.4,7); line(12,0,-11, 12,0,-10.5, DL,.4,7)
      // Tick marks every 2 units
      for(let x=-10;x<=10;x+=2) line(x,0,-11, x,0,-10.7, DL,.4,7)
      for(let z=-8;z<=6;z+=2) line(-13,0,z, -12.7,0,z, DL,.4,7)

      const maxOrder = 7

      // === PARTICLES ===
      const PC = 500
      const pGeo = new THREE.BufferGeometry()
      const pPos = new Float32Array(PC*3)
      const pVel: any[] = []
      for(let i=0;i<PC;i++) {
        pPos[i*3]=(Math.random()-0.5)*28; pPos[i*3+1]=Math.random()*25+5; pPos[i*3+2]=(Math.random()-0.5)*25
        pVel.push({vx:(Math.random()-.5)*.015, vy:-0.025-Math.random()*.02, vz:(Math.random()-.5)*.015})
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
      const pMat = new THREE.PointsMaterial({ color:0x2266ff, size:0.07, transparent:true, opacity:0.5 })
      const pts = new THREE.Points(pGeo, pMat)
      scene.add(pts)

      // Larger bright particles
      const PC2=80
      const pGeo2 = new THREE.BufferGeometry()
      const pPos2 = new Float32Array(PC2*3)
      const pVel2: any[] = []
      for(let i=0;i<PC2;i++) {
        pPos2[i*3]=(Math.random()-0.5)*24; pPos2[i*3+1]=Math.random()*20+2; pPos2[i*3+2]=(Math.random()-0.5)*20
        pVel2.push({vx:(Math.random()-.5)*.008, vy:-0.015-Math.random()*.01, vz:(Math.random()-.5)*.008})
      }
      pGeo2.setAttribute('position', new THREE.BufferAttribute(pPos2, 3))
      const pMat2 = new THREE.PointsMaterial({ color:0x00aaff, size:0.18, transparent:true, opacity:0.7 })
      const pts2 = new THREE.Points(pGeo2, pMat2)
      scene.add(pts2)

      // Grid floor
      const gH = new THREE.GridHelper(40,40, 0x0d2040, 0x071020)
      gH.position.y=-0.02; scene.add(gH)

      edges.sort((a,b)=>a.order-b.order)

      let startTime: number | null = null
      const DRAW_DUR=9000, LOOP=14000

      function animate(ts: number) {
        animationId = requestAnimationFrame(animate)
        if(!startTime) startTime=ts
        const elapsed=ts-startTime
        const loop=elapsed%LOOP

        if(loop<30 && elapsed>LOOP) {
          edges.forEach(e=>{
            e.progress=0; e.done=false
            const p=e.geo.attributes.position.array
            p[0]=e.x1;p[1]=e.y1;p[2]=e.z1;p[3]=e.x1;p[4]=e.y1;p[5]=e.z1
            e.geo.attributes.position.needsUpdate=true
          })
        }

        const dp=Math.min(loop/DRAW_DUR,1)

        edges.forEach(e=>{
          const startAt=(e.order/maxOrder)*0.65
          const lp=Math.max(0,Math.min(1,(dp-startAt)/0.4))
          if(lp>0 && !e.done) {
            e.progress=lp
            const p=e.geo.attributes.position.array
            p[0]=e.x1;p[1]=e.y1;p[2]=e.z1
            p[3]=e.x1+(e.x2-e.x1)*lp; p[4]=e.y1+(e.y2-e.y1)*lp; p[5]=e.z1+(e.z2-e.z1)*lp
            e.geo.attributes.position.needsUpdate=true
            if(lp>=1) e.done=true
          }
        })

        // Update particles
        const pp=pGeo.attributes.position.array
        for(let i=0;i<PC;i++) {
          pp[i*3]+=pVel[i].vx; pp[i*3+1]+=pVel[i].vy; pp[i*3+2]+=pVel[i].vz
          if(pp[i*3+1]<-1){ pp[i*3]=(Math.random()-.5)*28; pp[i*3+1]=Math.random()*8+15; pp[i*3+2]=(Math.random()-.5)*25 }
        }
        pGeo.attributes.position.needsUpdate=true

        const pp2=pGeo2.attributes.position.array
        for(let i=0;i<PC2;i++) {
          pp2[i*3]+=pVel2[i].vx; pp2[i*3+1]+=pVel2[i].vy; pp2[i*3+2]+=pVel2[i].vz
          if(pp2[i*3+1]<-1){ pp2[i*3]=(Math.random()-.5)*24; pp2[i*3+1]=Math.random()*6+14; pp2[i*3+2]=(Math.random()-.5)*20 }
        }
        pGeo2.attributes.position.needsUpdate=true

        // Camera orbit with vertical oscillation
        const angle=(elapsed/28000)*Math.PI*2
        camera.position.x=Math.sin(angle)*24+Math.sin(angle*0.3)*3
        camera.position.z=Math.cos(angle)*24+Math.cos(angle*0.7)*2
        camera.position.y=13+Math.sin(angle*0.4)*4
        camera.lookAt(0,4,0)

        renderer.render(scene,camera)
      }

      animate(0)

      const handleResize = () => {
        const w = window.innerWidth
        const h = window.innerHeight
        renderer.setSize(w, h)
        camera.aspect = w/h
        camera.updateProjectionMatrix()
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
    document.head.appendChild(threeScript)

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      if (threeScript.parentNode) document.head.removeChild(threeScript)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        display: 'block',
        opacity: 0.65,
        pointerEvents: 'none'
      }}
    />
  )
}