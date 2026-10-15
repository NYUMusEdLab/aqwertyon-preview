/* Local inference only. Model/runtime sources and licenses: provenance.json. */
importScripts('vendor/tf.min.js','vendor/music_rnn.js');
let model, queue=Promise.resolve();
self.onmessage=({data})=>{queue=queue.then(async()=>{
 try{
  if(!model){await tf.setBackend('cpu');await tf.ready();model=new music_rnn.MusicRNN(new URL('model/',self.location).href);await model.initialize();}
  if(data.type==='init'){postMessage({id:data.id,ready:true});return;}
  const sequence=await model.continueSequence(data.sequence,data.steps,data.temperature);
  postMessage({id:data.id,sequence});
 }catch(e){postMessage({id:data.id,error:e.message||'The melody model could not run.'});}
});};
