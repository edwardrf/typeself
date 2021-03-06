import java.io.File;
import java.io.IOException;


public class Converter {

	Raster target, canvas;
	int width, height;
	String outputFilename;
	Font font;
	char [][] charMap;
	int vStep = 4, hStep = 4;
	int charCount = 0;
	
	public Converter(String input, String output, String fontpath) throws IOException{
		target = new Raster(new File(input));
		target.brightness(0.8);
		canvas = new Raster(target.getWidth(), target.getHeight());
		outputFilename = output;
		font = new Font(new File(fontpath));

		int rows = target.getHeight() / vStep;
		int cols = target.getWidth() / hStep;
		charMap = new char[rows][cols];
	    for(int i = 0; i < rows; i ++){
	    	for(int j = 0; j < cols; j ++){
	    		charMap[i][j] = ' ';
	    	}
	    }
	}
	
	public void convert() {
		for (int k = 0; k < 16; k++) {
			System.err.println("Run number : " + (k + 1));
			int changes = 0;
			for (int i = 0; i < (target.getHeight() - font.getHeight()) / vStep; i++) {
				for (int j = 0; j < (target.getWidth() - font.getWidth()) / hStep; j++) {
					if(fitChar(i, j)) changes ++;
				}
			}
			System.err.println("Changed characters : " + changes);
			if(changes == 0) break;
		}
	}
	
	public boolean fitChar(int row, int col) {
		char bestChar = charMap[row][col];
		
		// Ignore mostly empty spaces
		int sampleSize = Math.max(font.getWidth(), font.getHeight());
	    int sampleValue = bestChar == ' ' ? target.sample(col * hStep, row * vStep, sampleSize) : Integer.MAX_VALUE;
	    if(sampleValue / sampleSize / sampleSize < 1) return false;
	    
	    // Remove the currently fitted character first
    	if(bestChar != ' ') {
	    	canvas.unpaint(col * hStep, row * vStep, font.getChar(bestChar));
	    	charCount --;
    	}
    	int bestScore = Integer.MAX_VALUE;
    	
	    // Then fit every possible char in the charSet
	    for(Character c : font.getCharSet()) {
	    	int score = 0;
	    	canvas.paint(col * hStep, row * vStep, font.getChar(c));
	    	// Try out different sample size for a total score
	    	for(int size = 1; size < 2; size += 2) {
	    		int [] diff = Raster.diff(target, canvas, col * hStep, row * vStep, font.getWidth(), font.getHeight(), size);
	    		score += (diff[0] + diff[1]);
            }
	    	
	    	if(score < bestScore){
	    		bestScore = score;
	    		bestChar = c;
	    	}
	    	canvas.unpaint(col * hStep, row * vStep, font.getChar(c));
	    }
	    
	    boolean changed = bestChar != charMap[row][col];
	    if(bestChar != ' '){
	    	canvas.paint(col * hStep, row * vStep, font.getChar(bestChar));
	    	charCount ++;
	    }
    	charMap[row][col] = bestChar;
	    return changed;
	}
	
	public int getCharCount() {
		return charCount;
	}

	public void print(){
		for(int i = 0; i < charMap.length; i++) {
			for(int j = 0; j < charMap[i].length; j++) {
				System.out.print(charMap[i][j]);
			}
			System.out.println();
		}
	}
	
	public void save() throws IOException {
		File outfile = new File(outputFilename);
		canvas.save(outfile);
	}
	
	public static void main(String[] args) throws IOException {
		if(args.length < 2) {
			System.out.println("Usage: java Converter INPUT_IMG OUTPUT_IMG FONT_DIR");
		}else {
			Converter c = new Converter(args[0], args[1], args[2]);
			System.out.println("~Cr"); // Fix the default color as it is reversed on the printer
			c.convert();
			c.save();
			c.print();
			System.err.println(args[0] +  " Total char count: " + c.getCharCount());
		}
	}

}
