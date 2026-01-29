this is "flash-sdxl" project. an end to end SDXL model serving web application. its focus is to serve sdxl-based model efficiently and effectively, unlike other local webui that only runs based on queue. this project can be deployed locally and can serve many generation request effciently. 

clarification:
- this project is not meant for end user(regular user besides admin) to upload their own model to be served.
- 

this project features three layer architecture:
- nextjs client
- nextjs backend
- sdxl server


about sdxl server:
- is a docker instance compiled with acceleration libraries.
- purpose is solely to generate images.
- effiecnt batched and queue based generation.
- some parameter can be set from the weabapp (admin-only)
- by default uses static model compilation (torchinductor or tensorrt). which mean different generation presets need recompilation
- comes with optimization to make sdxl inference fastest including: fp8 format. sage attention and flash attention backend. few step loras. model compile. batched generation. efficient batch count calculation. fused kernels. caching mechanism. tiny auto encoder. non gpu blocking async cpu operation (saving, upscaling)

features:
- email and password authentication.
- jwt based authorization
- optional email verification
- superadmin feature
- optional premium features
- text to image generation
- various sdxl model to serve
- support sampling mechanism and prediction type
- fixed resolution/ratio generation
- optional LLM prompt enhancer using external LLM serving app like vllm, llama.cpp


this project relies heavily on configuration/settings that is changed by admins. especially some features that is toggleable, for example (each of these feature can be set to premium or none)
- in-app credit for generation (optional)
- add-credit requirement in each generation preset
- credit purchase / addition mechanism
- loras support (require recompilation)
- store generation details (including generated images)
- custom resolution/ratio generation (require recompilation)
- hires fix presets
- vae choice (standard vs tiny autoencoder)


