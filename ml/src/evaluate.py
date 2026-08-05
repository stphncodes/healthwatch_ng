import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os

# Import our cleaning and feature engineering functions
from cleaning import clean_data
from feature_engineering import feature_engineer

def evaluate_model():
    """
    Loads data, performs cleaning and feature engineering, splits data,
    loads a trained model, and evaluates its performance.
    """
    print("\n--- Model Evaluation ---")
    
    # Define the path to the dataset
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'cholera_dataset.csv')
    
    # Load the dataset
    df = pd.read_csv(data_path)
    print("Dataset loaded successfully for evaluation.")
    
    # Apply cleaning
    df_cleaned = clean_data(df)
    
    # Apply feature engineering
    df_engineered = feature_engineer(df_cleaned)
    
    # Define features (X) and target (y)
    X = df_engineered.drop(columns=['cholera'])
    y = df_engineered['cholera']
    
    # Split data into training and testing sets (must be the same split as training)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Load the trained model
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'cholera_model.joblib')
    if not os.path.exists(model_path):
        print(f"Error: Trained model not found at {model_path}. Please run train.py first.")
        return
    
    model = joblib.load(model_path)
    print(f"Trained model loaded from: {model_path}")
    
    # Make predictions on the test set
    y_pred = model.predict(X_test)
    
    # Evaluate the model
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print("\n--- Model Performance Metrics (on test set) ---")
    print(f"Mean Absolute Error (MAE): {mae:.2f}")
    print(f"Mean Squared Error (MSE): {mse:.2f}")
    print(f"R-squared (R2): {r2:.2f}")
    
    # You can add more detailed analysis here, e.g., plotting predictions vs actuals
    # plt.figure(figsize=(10, 6))
    # plt.scatter(y_test, y_pred)
    # plt.xlabel("Actual Cholera Cases")
    # plt.ylabel("Predicted Cholera Cases")
    # plt.title("Actual vs Predicted Cholera Cases")
    # plt.plot([y.min(), y.max()], [y.min(), y.max()], 'k--', lw=2) # Diagonal line
    # plt.show()

if __name__ == "__main__":
    evaluate_model()