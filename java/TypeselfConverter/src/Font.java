import java.io.File;
import java.io.FileFilter;
import java.io.IOException;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;
import java.util.Vector;
import java.util.regex.Pattern;


public class Font {
	
	Map<Character, Raster> characters = new Hashtable<Character, Raster>();
	List<Character> charSet = new Vector<Character>();
	private int width, height;
	
	
	public Font(File dir) throws IOException{
		File [] fontFiles = dir.listFiles(new FileFilter(){
			public boolean accept(File file) {
				return file.isFile() && Pattern.matches(".\\.(jpg|png)", file.getName());
			}
		});
		for(int i = 0; i < fontFiles.length; i++) {
			char c = fontFiles[i].getName().charAt(0);
			Raster f = new Raster(fontFiles[i]);
			characters.put(c, f);
			charSet.add(c);
			if(f.width > width) {width = f.width;}
			if(f.height > height) {height = f.height;}
		}
		if(!characters.containsKey(' ')) {
			characters.put(' ', new Raster(width, height));
			charSet.add(' ');
		}
	}

	public List<Character> getCharSet() {
		return charSet;
	}
	
	public int getWidth() {
		return width;
	}

	public int getHeight() {
		return height;
	}

	public Raster getChar(char c){
		if(characters.containsKey(c)) {
			return characters.get(c);
		}else {
			return characters.get(' ');
		}
	}
}
