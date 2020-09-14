# Python file for drawing submission difference graph.
import matplotlib.pyplot as plt 
import numpy as np

def main():
    users = []
    questionId = 3893280
    file_path = "../../myData/" + str(questionId) + "/stat_result.txt"
    file = open(file_path, 'r')
    Lines = file.readlines()
    for line in Lines: 
        if "User" in line:
            data = line.split(":")
            temp = data[1].split()
            id = int(temp[0])
            if id not in users:
                users.append(id) 

    #count = 0
    for userId in users:
        path = "../../myData/" + str(questionId) + "/" + str(userId) + "/distance.txt" 
        f = open(path,"r")
        string = f.read()
        distance = string[string.find(':')+2:]
        """
        count += 1
        if count > 20:
            break
        """


        dis = distance.split()
        dis.append('0')

        title = "Question: " + str(questionId) + ", User: " + str(userId)
    
        y = [int(i) for i in dis]
        x = list(range(1, len(y)+1))
    
        plt.plot(x, y, 'g*-') 
        plt.xticks(np.arange(min(x), max(x)+1, 1.0))
        plt.xlabel('Number of submissions') 
        plt.ylabel('Levenshtein distance') 
        plt.title(title) 

        fig_path = "../../myData/" + str(questionId) + "/graph/" + str(userId) + ".png"
        axes = plt.gca()
        axes.set_ylim([0,1500])


        plt.savefig(fig_path)
        plt.clf()

    plt.close()

if __name__ == "__main__":
    main() 