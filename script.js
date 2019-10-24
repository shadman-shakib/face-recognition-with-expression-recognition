const imageUpload = document.getElementById('imageUpload') //assigning the uploaded image into imageUpload

//adding models
Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(start)

//function start 
async function start() {
  const container = document.createElement('div')
  container.style.position = 'relative'
  document.body.append(container)
  const labeledFaceDescriptors = await loadLabeledImages() //it'll call the image with label those are in folder
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6) //load the face to match
  let image
  let canvas
  let name
  let expression
  document.body.append('Loaded')
  imageUpload.addEventListener('change', async () => {
    if (image) image.remove()
    if (canvas) canvas.remove()
    image = await faceapi.bufferToImage(imageUpload.files[0])
    container.append(image)
    canvas = faceapi.createCanvasFromMedia(image)
    container.append(canvas)
    const displaySize = { width: image.width, height: image.height }
    faceapi.matchDimensions(canvas, displaySize)
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    results.forEach((result, i) => {
      name = result.toString()
      console.log(result.toString()) //showing result in console. showing the name
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas)
    })
    //container.append(image)
    container.append(canvas)
    const detections2 = await faceapi.detectAllFaces(image, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
    const resizedDetections2 = faceapi.resizeResults(detections2, displaySize)
    //console.log(resizedDetections2[0].expressions)
    resizedDetections2.forEach((result2,i) => {
      //console.log(resizedDetections2[i])
      console.log(result2.expressions) //showing the expressions result in console
      expression = result2.expressions
    }
    )
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections2)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections2)
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections2)
    //const results2 = resizedDetections2.map(d => faceMatcher.findBestMatch(d.descriptor))
    expression = resizedDetections2[0].expressions
    //insert(name,expression)
  })
}

function loadLabeledImages() {
  const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark','Ruhul'] //add new lebeled folder here
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {
        //fetching data from online. you can replace this with local directory
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/ruhul0/Face-Detection/master/labeled_images/${label}/${i}.jpg`) 
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}
//api call to pass data to php page
function insert(name,expression) {
  $.ajax({
  type: 'POST',
  url: 'insert.php',
  data: {
      name:name,
      expression:expression
  },
  error: function (xhr, status) {
      alert(status);
  },
  success: function(response) {
      //alert(response);
      //alert("Status Accepted");
      //alert(response);
      location.reload();
  }
});
}