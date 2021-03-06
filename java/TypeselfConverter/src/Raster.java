import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

import javax.imageio.ImageIO;

public class Raster {

	int[][] data;
	int width, height;

	public Raster() {
	}

	public Raster(File file) throws IOException {
		this.read(file);
	}

	public Raster(int width, int height) {
		this.width = width;
		this.height = height;
		this.data = new int[height][width];
	}

	public int getWidth() {
		return width;
	}

	public int getHeight() {
		return height;
	}

	public void read(File file) throws IOException {
		BufferedImage inputImage = ImageIO.read(file);
		this.width = inputImage.getWidth();
		this.height = inputImage.getHeight();

		data = new int[height][width];
		for (int i = 0; i < height; i++) {
			for (int j = 0; j < width; j++) {
				int c = inputImage.getRGB(j, i);
				int a = c >> 24 & 0xff;
				int r = c >> 16 & 0xff;
				int g = c >> 8 & 0xff;
				int b = c & 0xff;
				data[i][j] = (int) (255 - (0.2126 * r + 0.7152 * g + 0.0722 * b)
						* a / 255);
			}
		}
	}

	public void save(File file) throws IOException {
		BufferedImage outputImage = new BufferedImage(width, height,
				BufferedImage.TYPE_INT_RGB);
		for (int i = 0; i < height; i++) {
			for (int j = 0; j < width; j++) {
				int c = data[i][j];
				if (c > 255)
					c = 255;
				c = 255 - c;
				c = c + (c << 8) + (c << 16);
				outputImage.setRGB(j, i, c);
			}
		}
		String format = file.getName();
		format = format.substring(format.lastIndexOf('.') + 1);
		ImageIO.write(outputImage, format, file);
	}

	public void paint(int x, int y, Raster raster) {
		for (int i = 0; i < raster.height; i++) {
			for (int j = 0; j < raster.width; j++) {
				int lx = x + j;
				int ly = y + i;
				this.data[ly][lx] += raster.data[i][j];
			}
		}
	}

	public void unpaint(int x, int y, Raster raster) {
		for (int i = 0; i < raster.height; i++) {
			for (int j = 0; j < raster.width; j++) {
				int lx = x + j;
				int ly = y + i;
				this.data[ly][lx] -= raster.data[i][j];
			}
		}
	}

	public int sample(int x, int y, int size) {
		int sum = 0;
		for (int i = 0; i < size; i++) {
			for (int j = 0; j < size; j++) {
				int val = data[y + i][x + j];
				sum += val > 255 ? 255 : val;
			}
		}
		return sum;
	}

	public void brightness(double d) {
		for (int i = 0; i < height; i++) {
			for (int j = 0; j < width; j++) {
				data[i][j] = (int) Math.round(data[i][j] * d);
				data[i][j] = data[i][j] > 255 ? 255 : data[i][j];
			}
		}
	}

	public static int[] diff(Raster ra, Raster rb, int x, int y, int w, int h,
			int size) {
		int plus = 0, minus = 0;
		for (int i = 0; i < h; i++) {
			for (int j = 0; j < w; j++) {
				int a = ra.sample(x + j, y + i, size);
				int b = rb.sample(x + j, y + i, size);
				if (a > b) {
					plus += a - b;
				} else {
					minus += b - a;
				}
			}
		}
		int[] arr = { plus, minus };
		return arr;
	}

}
