from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import openai
import spacy
import jsonlines
import mysql.connector
from datetime import datetime, timedelta
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import CountVectorizer
import re

app = Flask(__name__)
CORS(app)
CORS(app, resources={r"/*": {"origins": "*"}})
# Replace with OpenAI API key
openai.api_key = "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"

# Replace with model ID
model_id = "curie:ft-ceyentra-technologies-pvt-ltd-2023-04-28-08-28-09"

# Load the English language model
nlp = spacy.load("en_core_web_md")

app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = '1234'
app.config['MYSQL_DB'] = 'chatbot'

# Connect mysql
conn = mysql.connector.connect(
    host=app.config['MYSQL_HOST'],
    user=app.config['MYSQL_USER'],
    password=app.config['MYSQL_PASSWORD'],
    database=app.config['MYSQL_DB']
)

# Load the dataset
dataset_file = "dataset/Degrees.jsonl"
dataset = []

# Read dataset and load it to dataset array
with jsonlines.open(dataset_file) as reader:
    for obj in reader:
        dataset.append(obj)

# Define a function to generate a response given a prompt
def generate_response(prompt):

    # Initialize variables for the highest similarity score and corresponding sentence
    max_score = -1
    max_sentence = None
    any_match = False
    
    # Search the dataset for a prompt that matches the given prompt
    for obj in dataset:
        # Define the two phrases
        doc1 = nlp(prompt)
        doc2 = nlp(obj['prompt'])
        vectorizer = CountVectorizer().fit_transform([doc1.text, doc2.text])
        similarity_score = cosine_similarity(vectorizer)[0][1]

        # If the similarity score is higher than the current max, update the max score and sentence
        if similarity_score > max_score:
            max_score = similarity_score
            max_sentence = obj['prompt']

        # If the similarity score is above the threshold, set the flag to True
        threshold = 0.5
        if similarity_score > threshold:
            any_match = True

    # Check if any sentence has a similarity score above the threshold
    if any_match:
        return max_sentence
    else:
        return "I'm sorry, I'm unable to understand your question. Please state your question more clearly or select one of the below shortcut queries, so that I can give my best to answer your question."
    
def has_email(prompt):
    email_regex = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'
    matches = re.findall(email_regex, prompt)
    return len(matches) > 0

# Define a Flask route to handle incoming chat requests
@app.route('/api/v1/chat/sendMessage', methods=['POST'])
@cross_origin()
def chat():
    # Parse the incoming request data
    data = request.get_json()
    roomId = data['roomId']
    prompt = data['prompt']
    user = data['user']
    date = data['date']
    time = data['time']

    messages_last = []

    current_datetime = datetime.now()
    formatted_datetime = current_datetime.strftime("%Y-%m-%d %H:%M:%S")

    cursor = conn.cursor()

    query  = 'SELECT * FROM message  WHERE room_r_id=%s'
    values = (roomId,)
    cursor.execute(query, values)
    row = cursor.fetchone()

    cursor.fetchall()

    if row is None:
        cursor.execute('INSERT INTO user (contact,date,email,name,role) VALUES (%s, %s,%s,%s,%s)', ("null",formatted_datetime,"null","null","UNKNOWN"))
        cursor.execute('SELECT * FROM user ORDER BY u_id DESC LIMIT 1')
        userDetails = cursor.fetchone()
        cursor.execute('INSERT INTO room (date,user_id) VALUES (%s, %s)', (formatted_datetime,userDetails[0]))
        cursor.execute('SELECT * FROM room ORDER BY r_id DESC LIMIT 1')
        roomDetails = cursor.fetchone()
        roomId = roomDetails[0]
        cursor.fetchall()
    else:
        roomId = data['roomId']   

    cursor.execute('INSERT INTO message (room_r_id,user,message,date,time) VALUES (%s, %s,%s,%s,%s)', (roomId,user, prompt,date,time))
    query = 'SELECT * FROM message  WHERE room_r_id=%s ORDER BY m_id DESC LIMIT 1'
    value = (roomId,)
    cursor.execute(query,value)
    userLastMessage = cursor.fetchone()
    userD = {
                'id': userLastMessage[0],
                'rid': userLastMessage[5],
                'user': userLastMessage[4],
                'message': userLastMessage[2],
                'date': userLastMessage[1].strftime('%Y-%m-%d'),
                'time': userLastMessage[3]
            }
    messages_last.append(userD)

    if(user != "admin"):

        if not(has_email(prompt)):

            # If the prompt is already exists in dataset, return true as response
            response = generate_response(prompt)
            
            if response.lower() == "hi" or response.lower() == "good morning" or response.lower() == "good evening" or response.lower() == "good afternoon" or response.lower() == "good night" or response.lower() == "hello" or response.lower() == "need help":
                response ="Hi!, I'm automated virtual assistant. How may I help you today?"  
            elif response == "I'm sorry, I'm unable to understand your question. Please state your question more clearly or select one of the below shortcut queries, so that I can give my best to answer your question.":
                response = "I'm sorry, I'm unable to understand your question. Please state your question more clearly or select one of the below shortcut queries, so that I can give my best to answer your question."
            elif response == "I want talk with human assistant" :
                response = "Sure, you can. Please wait a few minutes"
            else:
            
                # Generate a response using the OpenAI API and the specified model
                response = openai.Completion.create(
                    model=model_id,
                    prompt=response,
                    temperature=data.get('temperature', 0.2),
                    max_tokens=data.get('max_tokens', 200)
                ).choices[0].text.strip()

            cursor = conn.cursor()
            cursor.execute('INSERT INTO message (room_r_id,user,message,date,time) VALUES (%s, %s,%s,%s,%s)', (roomId,'bot', response,date,time))
            query = 'SELECT * FROM message  WHERE room_r_id=%s ORDER BY m_id DESC LIMIT 1'
            value = (roomId,)
            cursor.execute(query,value)
            botLastMessage = cursor.fetchone()
            conn.commit()

            bot = {
                        'id': botLastMessage[0],
                        'rid': botLastMessage[5],
                        'user': botLastMessage[4],
                        'message': botLastMessage[2],
                        'date': botLastMessage[1].strftime('%Y-%m-%d'),
                        'time': botLastMessage[3]
                    }
            messages_last.append(bot)

    # Return the response as a JSON object
    return jsonify({'response': messages_last})

@app.route('/api/v1/chat/getMessages/<userId>/<roomId>', methods=['GET'])
@cross_origin()
def get_data(userId, roomId):
    
    if request.method == 'GET':
        cursor = conn.cursor()
        query = 'SELECT * FROM message WHERE room_r_id=%s'
        values = (roomId,)
        cursor.execute(query, values)
        rows = cursor.fetchall()
        messages_list = []
        for message in list(rows):
            
            message_dict = {
                'id': message[0],
                'rid': message[5],
                'user': message[4],
                'message': message[2],
                'date': message[1].strftime('%Y-%m-%d'),
                'time': message[3]
            }
            
            messages_list.append(message_dict)

        return jsonify({'status': 200, 'data': messages_list})
    
@app.route('/api/v1/chat/getMessageCount/<userId>/<roomId>', methods=['GET'])
@cross_origin()
def get_Message_Count(userId, roomId):

    if request.method == 'GET':
        cursor = conn.cursor()
        query = 'SELECT COUNT(*) FROM message WHERE room_r_id=%s'
        values = (roomId,)
        cursor.execute(query, values)
        count = cursor.fetchone()[0]
        
        return jsonify({'status': 200, 'data': count})
    
def get_A_Message(id,roomId):
    cursor = conn.cursor()
    query = 'SELECT * FROM message WHERE m_id=%s AND room_r_id=%s'
    values = (id,roomId,)
    cursor.execute(query, values)
    response = cursor.fetchone()[0]
        
    return response
    
@app.route('/api/v1/chat/deleteMessage', methods=['POST'])
@cross_origin()
def delete_message():
    
    if request.method == 'POST':
        id = request.json.get('id')
        roomId = request.json.get('roomId')
        
        if id:
            cursor = conn.cursor()
            response = get_A_Message(id,roomId)
            query = 'DELETE FROM message WHERE m_id = %s AND room_r_id=%s'
            values = (id,roomId,)
            cursor.execute(query, values)
            conn.commit()
            return jsonify({'status': 200, 'message': response})
        else:
            return jsonify({'status': 400, 'message': 'Invalid Id'})


# Define a function to get all data for admin backend
@app.route('/api/v1/chat/getAllData', methods=['GET'])
@cross_origin()
def get_all_data():
    
    messages_list = []

    # Search the dataset for a prompt that matches the given prompt
    for obj in dataset:
        
        message_dict = {
                'prompt': obj['prompt'],
                'completion': obj['completion'],
                'temperature': obj['temperature'],
                'max_tokens': obj['max_tokens']
        }
            
        messages_list.append(message_dict)

    return jsonify({'status': 200, 'data': messages_list})

# Define a function to save new data for admin backend
@app.route('/api/v1/chat/saveData', methods=['POST'])
@cross_origin()
def save_new_data():
    
    data = request.get_json()
    prompt = data['prompt']
    completion = data['completion']
    temperature = data['temperature']
    max_tokens = data['max_tokens']
    
    message = {
        'prompt': prompt,
        'completion': completion,
        'temperature': temperature,
        'max_tokens': max_tokens
    }

    dataset = []

    with jsonlines.open(dataset_file, 'r') as reader:
        for obj in reader:
            dataset.append(obj)

    dataset.append(message)

    # Save the updated dataset back to the JSONL file
    with jsonlines.open(dataset_file, 'w') as writer:
        for obj in dataset:
            writer.write(obj)        

    return jsonify({'status': 200, 'data': message})

# Define a function to edit data for admin backend
@app.route('/api/v1/chat/editData', methods=['POST'])
@cross_origin()
def edit_data():
    
    data = request.get_json()
    prompt = data['prompt']
    completion = data['completion']
    temperature = data['temperature']
    max_tokens = data['max_tokens']
    
    message = {
        'prompt': prompt,
        'completion': completion,
        'temperature': temperature,
        'max_tokens': max_tokens
    }

    # Find the index of the prompt to be edited in the dataset
    prompt_index = None
    for i, obj in enumerate(dataset):
        if obj['prompt'] == prompt:
            prompt_index = i
            break

    # If the prompt is found, update its details
    if prompt_index is not None:
        dataset[prompt_index] = message

        # Save the updated dataset back to the JSONL file
        with jsonlines.open(dataset_file, 'w') as writer:
            writer.write_all(dataset)

        return jsonify({'status': 200, 'data': message})
    else:
        return jsonify({'status': 404, 'message': 'Prompt not found'})
    
@app.route('/api/v1/chat/deleteData', methods=['DELETE'])
@cross_origin()
def delete_data():
    data = request.get_json()
    prompt = data['prompt']

    # Find the index of the prompt to be deleted in the dataset
    prompt_index = None
    for i, obj in enumerate(dataset):
        if obj['prompt'] == prompt:
            prompt_index = i
            break

    # If the prompt is found, remove it from the dataset
    if prompt_index is not None:
        deleted_prompt = dataset.pop(prompt_index)

        # Save the updated dataset back to the JSONL file
        with jsonlines.open(dataset_file, 'w') as writer:
            writer.write_all(dataset)

        return jsonify({'status': 200, 'message': 'Prompt deleted', 'data': deleted_prompt})
    else:
        return jsonify({'status': 404, 'message': 'Prompt not found'})

if __name__ == '__main__':
    app.run(debug=True)
